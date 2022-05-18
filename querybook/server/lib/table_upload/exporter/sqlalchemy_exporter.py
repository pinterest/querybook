from typing import Tuple

from app.db import with_session
from logic.admin import get_query_engine_by_id
from lib.query_executor.all_executors import get_executor_class
from lib.query_executor.clients.sqlalchemy import SqlAlchemyClient

from lib.table_upload.exporter.utils import (
    update_pandas_df_column_name_type,
)
from .base_exporter import BaseTableUploadExporter


default_pandas_to_sql_config = {
    "schema": None,
    "if_exists": "fail",
    "index": False,
    "chunksize": 10000,
}


class SqlalchemyExporter(BaseTableUploadExporter):
    @with_session
    def _get_sqlalchemy_connection(self, session=None):
        engine = get_query_engine_by_id(self._engine_id, session=session)
        executor = get_executor_class(engine.language, engine.executor)
        executor_params = engine.get_engine_params()
        client = executor._get_client(executor_params)

        if not isinstance(client, SqlAlchemyClient):
            raise ValueError(f"Client instance {client} is not SqlAlchemy Based")

        conn = client._engine.connect()
        return conn

    def _get_pandas_to_sql_config(self):
        connection = self._get_sqlalchemy_connection()

        config = {
            "name": self._table_config["table_name"],
            "schema": self._table_config.get("schema_name", None),
            "con": connection,
            "if_exists": self._table_config.get("if_exists", "fail"),
            "index": False,
            "chunksize": 10000,
        }

        return config

    def _upload(self) -> Tuple[str, str]:
        df = update_pandas_df_column_name_type(
            self._importer.get_pandas_df(), self._table_config["column_name_types"]
        )
        config = self._get_pandas_to_sql_config()
        df.to_sql(**config)
