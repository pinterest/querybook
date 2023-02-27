from typing import List, Tuple

from const.metastore import DataColumn, DataTable
from lib.utils import json as ujson
from lib.utils.utils import DATETIME_TO_UTC

from .sqlalchemy_metastore_loader import SqlAlchemyMetastoreLoader


class MysqlMetastoreLoader(SqlAlchemyMetastoreLoader):
    def get_table_and_columns(
        self, schema_name, table_name
    ) -> Tuple[DataTable, List[DataColumn]]:
        raw_table_info = next(
            iter(
                self._engine.execute(
                    f"""
            SELECT
                TABLE_TYPE,
                CREATE_TIME,
                UPDATE_TIME,
                data_length + index_length
            FROM
                INFORMATION_SCHEMA.TABLES
            WHERE
                TABLE_SCHEMA="{schema_name}" AND TABLE_NAME="{table_name}"
        """
                )
            ),
            None,
        )

        if not raw_table_info:
            return None, []

        table = DataTable(
            name=table_name,
            type=raw_table_info[0],
            owner=None,
            table_created_at=DATETIME_TO_UTC(raw_table_info[1])
            if raw_table_info[1] is not None
            else None,
            table_updated_by=None,
            table_updated_at=DATETIME_TO_UTC(raw_table_info[2])
            if raw_table_info[2] is not None
            else None,
            data_size_bytes=raw_table_info[3],
            location=None,
            partitions=None,
            raw_description=ujson.pdumps(list(raw_table_info)),
        )

        raw_columns = self._inspect.get_columns(
            table_name=table_name, schema=schema_name
        )
        columns = list(
            map(
                lambda col: DataColumn(
                    name=col["name"],
                    type=str(col["type"]),
                    comment=f"Default:{col['default']} Nullable:{col['nullable']}",
                ),
                raw_columns,
            )
        )

        return table, columns
