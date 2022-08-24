from abc import ABCMeta, abstractclassmethod, abstractmethod
from typing import List, Tuple


class BaseCreateTable(metaclass=ABCMeta):
    def __init__(
        self,
        schema_name: str,
        table_name: str,
        column_name_types: List[Tuple[str, str]],
        file_format: str,
        file_location: str = None,
        table_properties: List[str] = [],
    ):
        self._table_name = (
            table_name if not schema_name else f"{schema_name}.{table_name}"
        )
        self._column_name_types = column_name_types
        self._file_location = file_location
        self._format = file_format
        self._table_properties = table_properties

    @abstractclassmethod
    def get_language(cls) -> str:
        """Return the language for the create table creator

        Returns:
            str: Can be 'presto', 'hive', etc. Keep it in sync with
                 language used by QueryExecutor
        """
        return ""

    @abstractmethod
    def _get_create_prefix(self) -> str:
        """Override this method to return the
           part of create table that is before the column definition
           for example: "CREATE TABLE schema.table"

        Returns:
            str
        """
        raise NotImplementedError()

    @abstractmethod
    def _get_column_defs(self) -> List[str]:
        """Return a list of column with types that appears
        in the create table statement. For example,
        ['foo VARCHAR', 'bar BigInt', 'baz Float']

        Returns:
            List[str]: The list of column and types
        """
        raise NotImplementedError()

    @abstractmethod
    def _get_extra_properties(self) -> str:
        """Return everything that appears after the column definiton.
           For example in Sparksql, we can return "LOCATIOn 's3://bucket/key'"

        Returns:
            str: Anything that appears after the column definition query
        """
        raise NotImplementedError()

    def get_create_query(self) -> str:
        create_table_prefix = self._get_create_prefix()
        column_defs = self._get_column_defs()
        column_defs_str = ",\n".join(column_defs)
        extra_properties = self._get_extra_properties()

        return f"{create_table_prefix}\n(\n{column_defs_str}\n)\n{extra_properties}"
