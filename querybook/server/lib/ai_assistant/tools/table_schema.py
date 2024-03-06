from typing import Callable

from app.db import with_session
from lib.vector_store import get_vector_store
from logic import metastore as m_logic
from models.metastore import DataTable, DataTableColumn


def get_table_documentation(table: DataTable) -> str:
    """Get table documentation.
    Try to get it from database first. If not found, get it from the vector store.
    """
    if table.information.description:
        return table.information.description

    vs = get_vector_store()
    if vs:
        return vs.get_table_summary(table.id)

    return ""


def _get_column(column: DataTableColumn) -> dict[str, str]:
    column_json = {}

    column_json["name"] = column.name
    column_json["type"] = column.type
    if column.description:
        column_json["description"] = column.description
    elif column.data_elements:
        # use data element's description when column's description is empty
        # TODO: only handling the REF data element for now. Need to handle ARRAY, MAP and etc in the future.
        column_json["description"] = column.data_elements[0].description
        column_json["data_element"] = column.data_elements[0].name

    if len(column.statistics):
        column_json["statistics"] = {
            stat.key: stat.value for stat in column.statistics if stat.value is not None
        }

    return column_json


def _get_table_schema(
    table: DataTable,
    should_skip_column: Callable[[DataTableColumn], bool] = None,
) -> dict:
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
        return {}

    table_json = {}

    table_json["table_name"] = f"{table.data_schema.name}.{table.name}"
    table_json["table_description"] = get_table_documentation(table)

    columns = []
    for column in table.columns:
        if should_skip_column and should_skip_column(column):
            continue

        columns.append(_get_column(column))

    table_json["columns"] = columns
    return table_json


@with_session
def get_table_schema_by_id(
    table_id: int,
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> dict:
    """Generate table schema prompt by table id"""
    table = m_logic.get_table_by_id(table_id=table_id, session=session)
    return _get_table_schema(table, should_skip_column)


@with_session
def get_table_schemas_by_ids(
    table_ids: list[int],
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> list[dict]:
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
def get_table_schema_by_name(
    metastore_id: int,
    full_table_name: str,
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> dict:
    """Generate table schema prompt by full table name"""
    full_table_name_parts = full_table_name.split(".")
    if len(full_table_name_parts) != 2:
        return None

    table_schema, table_name = full_table_name_parts
    table = m_logic.get_table_by_name(
        schema_name=table_schema,
        name=table_name,
        metastore_id=metastore_id,
        session=session,
    )
    return _get_table_schema(table, should_skip_column)


@with_session
def get_table_schemas_by_names(
    metastore_id: int,
    full_table_names: list[str],
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> list[dict]:
    """Generate table schemas prompt by table names"""
    return [
        get_table_schema_by_name(
            metastore_id=metastore_id,
            full_table_name=table_name,
            should_skip_column=should_skip_column,
            session=session,
        )
        for table_name in full_table_names
    ]


def get_slimmed_table_schemas(table_schemas: list[dict]) -> list[dict]:
    """Get a slimmed version of the table schemas, which will only keep below fields:
    - table_name
    - columns:
        name
        type
    """
    column_keys_to_keep = ["name", "type"]

    return [
        {
            "table_name": schema["table_name"],
            "columns": [
                {k: c[k] for k in column_keys_to_keep if k in c}
                for c in schema["columns"]
            ],
        }
        for schema in table_schemas
    ]
