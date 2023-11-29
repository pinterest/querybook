from typing import Dict, List, Tuple

from const.metastore import DataColumn, DataTable
from lib.metastore.base_metastore_loader import BaseMetastoreLoader
from lib.query_executor.connection_string.sqlalchemy import create_sqlalchemy_engine
from lib.query_executor.executor_template.templates import sqlalchemy_template


class SqlAlchemyMetastoreLoader(BaseMetastoreLoader):
    def __init__(self, metastore_dict: Dict):
        self._engine, self._inspect, self._conn = self._get_sqlalchemy(metastore_dict)
        super(SqlAlchemyMetastoreLoader, self).__init__(metastore_dict)

    def __del__(self):
        self._conn.close()
        del self._inspect
        self._engine.dispose()

    @classmethod
    def get_metastore_params_template(cls):
        return sqlalchemy_template

    def get_all_schema_names(self) -> List[str]:
        return self._inspect.get_schema_names()

    def get_all_table_names_in_schema(self, schema_name: str) -> List[str]:
        if self._engine.dialect.name == "bigquery":
            return [
                table.split(".")[1]
                for table in self._inspect.get_table_names(schema=schema_name)
            ]
        else:
            return self._inspect.get_table_names(schema=schema_name)

    def get_table_and_columns(
        self, schema_name, table_name
    ) -> Tuple[DataTable, List[DataColumn]]:
        if not self._engine.dialect.has_table(
            self._conn, table_name=table_name, schema=schema_name
        ):
            return None, []

        table = DataTable(
            name=table_name,
            type=None,
            owner=None,
            table_created_at=None,
            table_updated_by=None,
            table_updated_at=None,
            data_size_bytes=None,
            location=None,
            partitions=None,
            raw_description="",
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

    def _get_sqlalchemy(self, metastore_dict):
        from sqlalchemy.engine import reflection

        engine = create_sqlalchemy_engine(metastore_dict["metastore_params"])
        inspect = reflection.Inspector.from_engine(engine)
        conn = engine.connect()

        return engine, inspect, conn
