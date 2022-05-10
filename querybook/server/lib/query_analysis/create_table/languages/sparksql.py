from typing import List
from lib.query_analysis.create_table.base_create_table import BaseCreateTable
from lib.table_upload.common import UploadTableColumnType
from lib.query_analysis.create_table.helper import is_custom_column_type

UPLOAD_COL_TYPE_TO_SPARKSQL_TYPE = {
    UploadTableColumnType.BOOLEAN: "BOOLEAN",
    UploadTableColumnType.DATETIME: "DATE",
    UploadTableColumnType.FLOAT: "DOUBLE",
    UploadTableColumnType.INTEGER: "BIGINT",
    UploadTableColumnType.STRING: "STRING",
}


class SparkSQLCreateTable(BaseCreateTable):
    @classmethod
    def get_language(cls) -> str:
        return "sparksql"

    def _get_column_defs(self) -> List[str]:
        ret = []
        for col_name, col_type in self._column_name_types:
            escaped_col_name = f"`{col_name}`"

            actual_col_type = col_type
            if not is_custom_column_type(col_type):
                upload_col_type = UploadTableColumnType(col_type)
                actual_col_type = UPLOAD_COL_TYPE_TO_SPARKSQL_TYPE[upload_col_type]

            ret.append(f"{escaped_col_name} {actual_col_type}")
        return ret

    def _get_create_prefix(self) -> str:
        return f"CREATE EXTERNAL TABLE {self._table_name}"

    def _get_extra_properties(self) -> str:
        rows = [
            "ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'",
            "FIELDS TERMINATED BY ',' ESCAPED BY '\"' LINES TERMINATED BY '\n'",
            f"STORED AS {self._format}",
            f"LOCATION '{self._file_location}'"
            'TBLPROPERTIES ("skip.header.line.count"="1")',
        ]
        return "\n".join(rows)
