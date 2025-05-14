from collections import defaultdict
from typing import Any, Callable, Optional, TypedDict


from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload, load_only
from app.db import with_session
from logic import metastore as m_logic
from models.metastore import (
    DataSchema,
    DataTable,
    DataTableColumn,
)
from models.tag import TagItem


class ColumnInfo(TypedDict):
    name: str
    type: str
    description: Optional[str]
    data_element: Optional[str]
    statistics: Optional[dict[str, Any]]


class TagInfo(TypedDict):
    type: str
    name: str


class TableSchema(TypedDict):
    table_name: str
    table_description: str
    latest_partitions: Optional[list[str]]
    column_info: Optional[Any]
    tags: list[TagInfo]
    columns: list[ColumnInfo]


class SlimmedColumns(TypedDict):
    properties: list[str]
    data: list[tuple[str, str]]


class SlimmedTableSchema(TypedDict):
    table_name: str
    table_description: str
    table_tier: Optional[str]
    columns: SlimmedColumns


def _get_column(column: DataTableColumn) -> ColumnInfo:
    column_info: ColumnInfo = {
        "name": column.name,
        "type": column.type,
        "description": None,
        "data_element": None,
        "statistics": None,
    }

    if column.description:
        column_info["description"] = column.description
    elif column.data_elements:
        # use data element's description when column's description is empty
        # TODO: only handling the REF data element for now. Need to handle ARRAY, MAP and etc in the future.
        column_info["description"] = column.data_elements[0].description
        column_info["data_element"] = column.data_elements[0].name

    if len(column.statistics):
        column_info["statistics"] = {
            stat.key: stat.value for stat in column.statistics if stat.value is not None
        }

    return column_info


def _get_table_schema(
    table: DataTable,
    should_skip_column: Optional[Callable[[DataTableColumn], bool]] = None,
) -> Optional[TableSchema]:
    """Generate table schema prompt. The format will be like:

    Table Name: [Name_of_table_1]
    Description: [Brief_general_description_of_Table_1]
    Columns:
    - Column Name: [Column1_name]
        Data Type: [Column1_data_type]
        Description: [Brief_description_of_the_column1_purpose]
    - Column Name: [Column2_name]
        Data Type: [Column2_data_type]
        Description: [Brief_description_of_the_column2_purpose]
        Data Element: [Data_element_name]
    """
    if not table:
        return None

    table_schema: TableSchema = {
        "table_name": f"{table.data_schema.name}.{table.name}",
        "table_description": table.information.description,
        "latest_partitions": table.information.latest_partitions,
        "column_info": table.information.column_info,
        "tags": [
            {"type": tag.tag.meta.get("type"), "name": tag.tag_name}
            for tag in table.tags
        ],
        "columns": [],
    }

    columns = []
    for column in table.columns:
        if should_skip_column and should_skip_column(column):
            continue

        columns.append(_get_column(column))

    table_schema["columns"] = columns
    return table_schema


@with_session
def get_table_schema_by_id(
    table_id: int,
    should_skip_column: Optional[Callable[[DataTableColumn], bool]] = None,
    session=None,
) -> Optional[TableSchema]:
    """Generate table schema prompt by table id"""
    table = m_logic.get_table_by_id(table_id=table_id, session=session)
    return _get_table_schema(table, should_skip_column)


@with_session
def get_table_schemas_by_ids(
    table_ids: list[int],
    should_skip_column: Optional[Callable[[DataTableColumn], bool]] = None,
    session=None,
) -> list[Optional[TableSchema]]:
    """Generate table schemas prompt by table ids"""
    return [
        get_table_schema_by_id(
            table_id=table_id,
            should_skip_column=should_skip_column,
            session=session,
        )
        for table_id in table_ids
    ]


@with_session
def get_table_schemas_by_names(
    metastore_id: int,
    full_table_names: list[str],
    should_skip_column: Optional[Callable[[DataTableColumn], bool]] = None,
    session=None,
) -> list[Optional[TableSchema]]:
    """Retrieve table schemas for specified tables in a metastore.

    This function fetches table schemas for a list of fully qualified table names
    (schema.table) from a specific metastore. It performs optimized database queries
    to retrieve table information, columns, and tags in separate batches.

    Args:
        metastore_id: The ID of the metastore to query.
        full_table_names: List of fully qualified table names in the format "schema.table".
        should_skip_column: Optional function that determines if a column should be excluded
            from the result. Takes a DataTableColumn as input and returns a boolean.
        session: Optional database session. If not provided, a new session will be created.

    Returns:
        A list of dictionaries containing schema information for each requested table,
        in the same order as the input list.

    Note:
        This function optimizes database access by loading table metadata, columns,
        and tags in separate queries to minimize the amount of data transferred.
    """
    if not full_table_names or not session:
        return []

    # Parse table names
    parsed_tables = []
    for full_table_name in full_table_names:
        parts = full_table_name.split(".")
        if len(parts) == 2:
            parsed_tables.append((parts[0], parts[1]))

    if not parsed_tables:
        return []

    # Create filters for each schema+table combination
    conditions = []
    for schema_name, table_name in parsed_tables:
        conditions.append(
            and_(DataSchema.name == schema_name, DataTable.name == table_name)
        )

    # STEP 1: Get just the basic table data with schema and information
    tables = (
        session.query(DataTable)
        .join(DataSchema, DataTable.schema_id == DataSchema.id)
        .filter(DataSchema.metastore_id == metastore_id)
        .filter(or_(*conditions))
        .options(
            load_only("id", "name", "schema_id"),
            joinedload(DataTable.data_schema).load_only("id", "name"),
            joinedload(DataTable.information).load_only(
                "description", "latest_partitions"
            ),
        )
        .all()
    )

    # Build a lookup map of table IDs
    table_ids = [table.id for table in tables]

    if not table_ids:
        return []

    # STEP 2: Load columns in a separate query
    column_data = (
        session.query(DataTableColumn)
        .filter(DataTableColumn.table_id.in_(table_ids))
        .options(
            load_only("id", "name", "type", "description", "table_id"),
            # Eager load data elements
            joinedload(DataTableColumn.data_elements).load_only("description", "name"),
            # Eager load statistics
            joinedload(DataTableColumn.statistics).load_only("key", "value"),
        )
        .all()
    )

    # Group columns by table_id
    columns_by_table = defaultdict(list)
    for col in column_data:
        columns_by_table[col.table_id].append(col)

    # STEP 3: Load tags in a separate query
    tags_data = (
        session.query(TagItem)
        .filter(TagItem.table_id.in_(table_ids))
        .options(
            load_only("id", "tag_name", "table_id"),
            joinedload(TagItem.tag).load_only("id", "meta"),
        )
        .all()
    )

    # Group tags by table_id
    tags_by_table = {}
    for tag in tags_data:
        if tag.table_id not in tags_by_table:
            tags_by_table[tag.table_id] = []
        tags_by_table[tag.table_id].append(tag)

    # Manually associate columns and tags with their tables
    for table in tables:
        table.columns = columns_by_table.get(table.id, [])
        table.tags = tags_by_table.get(table.id, [])

    # Build a map for quick lookup
    table_map = {f"{table.data_schema.name}.{table.name}": table for table in tables}

    # Create schemas in the same order as the input
    result = []
    for full_table_name in full_table_names:
        table = table_map.get(full_table_name)
        if table:
            result.append(_get_table_schema(table, should_skip_column))
        else:
            result.append(None)

    return result


@with_session
def get_table_schema_by_name(
    metastore_id: int,
    full_table_name: str,
    should_skip_column: Optional[Callable[[DataTableColumn], bool]] = None,
    session=None,
) -> Optional[TableSchema]:
    """Generate table schema prompt by full table name"""
    table_schemas = get_table_schemas_by_names(
        metastore_id=metastore_id,
        full_table_names=[full_table_name],
        should_skip_column=should_skip_column,
        session=session,
    )

    return table_schemas[0] if table_schemas else None


def get_slimmed_table_schemas(
    table_schemas: list[TableSchema], column_keys_to_keep=["name", "type"]
) -> list[SlimmedTableSchema]:
    """Get a slimmed version of the table schemas, which will only keep below fields:
    - table_name
    - table_description
    - table_tier
    - columns:
        name
        type
    """

    return [
        {
            "table_name": schema.get("table_name"),
            "table_description": schema["table_description"],
            "table_tier": next(
                (tag["name"] for tag in schema["tags"] if tag["type"] == "TABLE_TIER"),
                None,
            ),
            # use a compact format for columns to save tokens
            "columns": {
                "properties": column_keys_to_keep,
                "data": [
                    tuple(c.get(k) for k in column_keys_to_keep)
                    for c in schema["columns"]
                ],
            },
        }
        for schema in table_schemas
    ]
