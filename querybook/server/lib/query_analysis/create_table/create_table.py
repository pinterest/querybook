from typing import Dict, List, Tuple

from .base_create_table import BaseCreateTable
from .languages.hive import HiveCreateTable, SparkSQLCreateTable
from .languages.presto import PrestoCreateTable, TrinoCreateTable

CREATE_TABLE_CLS_BY_LANGUAGE: Dict[str, BaseCreateTable] = {
    creator.get_language(): creator
    for creator in [
        HiveCreateTable,
        PrestoCreateTable,
        TrinoCreateTable,
        SparkSQLCreateTable,
    ]
}


def get_create_table_statement(
    language: str,
    table_name: str,
    column_name_types: List[Tuple[str, str]],
    file_location: str = None,
    schema_name: str = "",
    file_format: str = "TEXTFILE",
    table_properties: List[str] = [],
):
    """Generate a query that can be executed to create
       an external table. It is mostly applicable for Hive tables

    Args:
        language (str): The language context, for example presto/hive/sparksql
        table_name (str): the name of the table
        column_name_types (List[Tuple[str, str]]): array of column names and their types
        file_location (str, optional): The location of the external file, if None,
                                       then the table is managed instead of external
        schema_name (str, optional): the name of the schema, if empty, default schema would be used
        file_format (str, optional): format of the file, most likely it is TEXTFILE or PARQUET
    """
    if language not in CREATE_TABLE_CLS_BY_LANGUAGE:
        raise Exception(
            f"Language {language} is not supported to create external support in Querybook"
        )

    table_creator_cls = CREATE_TABLE_CLS_BY_LANGUAGE[language]
    table_creator: BaseCreateTable = table_creator_cls(
        schema_name,
        table_name,
        column_name_types,
        file_format,
        file_location,
        table_properties,
    )

    return table_creator.get_create_query()
