from typing import List
from lib.query_analysis.create_table.base_create_table import BaseCreateTable
from lib.table_upload.common import UploadTableColumnType

UPLOAD_COL_TYPE_TO_PRESTO_TYPE = {
    UploadTableColumnType.BOOLEAN: "BOOLEAN",
    UploadTableColumnType.DATETIME: "DATE",
    UploadTableColumnType.FLOAT: "DOUBLE",
    UploadTableColumnType.INTEGER: "BIGINT",
    UploadTableColumnType.STRING: "VARCHAR",
}


class PrestoCreateTable(BaseCreateTable):
    @classmethod
    def get_language(cls) -> str:
        return "presto"

    def _get_column_defs(self) -> List[str]:
        ret = []
        for col_name, col_type in self._column_name_types:
            escaped_col_name = f'"{col_name}"'
            # Limitation by Presto, only varchar is supported
            ret.append(f"{escaped_col_name} VARCHAR")
        return ret

    def _get_create_prefix(self) -> str:
        return f"CREATE TABLE {self._table_name}"

    def _get_extra_properties(self) -> str:
        properties = [
            "csv_escape = '\\'",
            "csv_quote = '\"'",
            "csv_separator = ','",
            f"external_location='{self._file_location}'",
            "format = 'csv'",
            "skip_header_line_count = 1",
        ]
        properties_str = ",\n".join(properties)
        return "WITH (\n" + properties_str + "\n)"


class TrinoCreateTable(PrestoCreateTable):
    @classmethod
    def get_language(cls) -> str:
        return "trino"
