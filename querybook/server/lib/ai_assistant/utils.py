from typing import Callable

from app.db import with_session
from logic import metastore as m_logic
from models.metastore import DataSchema, DataTable, DataTableColumn


def _get_table_schema_prompt(
    table: DataTable,
    should_skip_column: Callable[[DataTableColumn], bool] = None,
):
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
        return ""

    prompt = ""

    full_table_name = f"{table.data_schema.name}.{table.name}"
    table_description = table.information.description or ""

    prompt += f"Table Name: {full_table_name}\n"
    prompt += f"Description: {table_description}\n"

    prompt += "Columns:\n"
    for column in table.columns:
        if should_skip_column and should_skip_column(column):
            continue

        prompt += f"- Column Name: {column.name}\n"
        prompt += f"  Data Type: {column.type}\n"
        if column.description:
            prompt += f"  Description: {column.description}\n"
        elif column.data_elements:
            # use data element's description when column's description is empty
            # TODO: only handling the REF data element for now. Need to handle ARRAY, MAP and etc in the future.
            prompt += f"  Description: {column.data_elements[0].description}\n"
            prompt += f"  Data Element: {column.data_elements[0].name}\n"

    return prompt


@with_session
def get_table_schema_prompt_by_id(
    table_id: int,
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> str:
    """Generate table schema prompt by table id"""
    table = m_logic.get_table_by_id(table_id=table_id, session=session)
    return _get_table_schema_prompt(table, should_skip_column)


@with_session
def get_table_schemas_prompt_by_ids(
    table_ids: list[int],
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> str:
    """Generate table schemas prompt by table ids"""
    return "\n\n".join(
        [
            get_table_schema_prompt_by_id(
                table_id=table_id,
                should_skip_column=should_skip_column,
                session=session,
            )
            for table_id in table_ids
        ]
    )


@with_session
def get_table_schema_prompt_by_name(
    metastore_id: int,
    full_table_name: str,
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> str:
    """Generate table schema prompt by full table name"""
    table_schema, table_name = full_table_name.split(".")
    table = m_logic.get_table_by_name(
        schema_name=table_schema,
        name=table_name,
        metastore_id=metastore_id,
        session=session,
    )
    return _get_table_schema_prompt(table, should_skip_column)


@with_session
def get_table_schemas_prompt_by_names(
    metastore_id: int,
    full_table_names: list[str],
    should_skip_column: Callable[[DataTableColumn], bool] = None,
    session=None,
) -> str:
    """Generate table schemas prompt by table names"""
    return "\n\n".join(
        [
            get_table_schema_prompt_by_name(
                metastore_id=metastore_id,
                full_table_name=table_name,
                should_skip_column=should_skip_column,
                session=session,
            )
            for table_name in full_table_names
        ]
    )
