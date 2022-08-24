from typing import List
from lib.query_analysis.create_table.base_create_table import BaseCreateTable
from lib.table_upload.common import UploadTableColumnType
from lib.query_analysis.create_table.helper import is_custom_column_type

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
            if self._format == "CSV":
                # Limitation by Presto, only varchar is supported
                ret.append(f"{escaped_col_name} VARCHAR")
            elif self._format == "PARQUET":
                actual_col_type = col_type
                if not is_custom_column_type(col_type):
                    upload_col_type = UploadTableColumnType(col_type)
                    actual_col_type = UPLOAD_COL_TYPE_TO_PRESTO_TYPE[upload_col_type]
                ret.append(f"{escaped_col_name} {actual_col_type}")
        return ret

    def _get_create_prefix(self) -> str:
        return f"CREATE TABLE {self._table_name}"

    def _get_extra_properties(self) -> str:
        properties = list(self._table_properties)
        if self._file_location is not None:
            properties += [f"external_location='{self._file_location}'"]

        if self._format == "CSV":
            properties += [
                "format = 'csv'",
                "csv_escape = '\\'",
                "csv_quote = '\"'",
                "csv_separator = ','",
                "skip_header_line_count = 1",
            ]
        elif self._format == "PARQUET":
            properties += ["format = 'PARQUET'"]
        else:
            raise ValueError(f"Unsupported Presto file type {self._format}")

        properties_str = ",\n".join(properties)
        return "WITH (\n" + properties_str + "\n)"


class TrinoCreateTable(PrestoCreateTable):
    @classmethod
    def get_language(cls) -> str:
        return "trino"
