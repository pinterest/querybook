from typing import Tuple
from sqlalchemy import types as sa_types

from app.db import with_session
from logic.admin import get_query_engine_by_id
from lib.query_executor.all_executors import get_executor_class
from lib.query_executor.clients.sqlalchemy import SqlAlchemyClient
from lib.query_analysis.create_table.helper import is_custom_column_type
from lib.table_upload.common import UploadTableColumnType
from .base_exporter import BaseTableUploadExporter


default_pandas_to_sql_config = {
    "schema": None,
    "if_exists": "fail",
    "index": False,
    "chunksize": 10000,
}

UPLOADED_TABLE_COL_TYPE_TO_SQLALCHEMY_TYPE = {
    UploadTableColumnType.BOOLEAN: sa_types.Boolean(),
    UploadTableColumnType.DATETIME: sa_types.DateTime(),
    UploadTableColumnType.STRING: sa_types.String(),
    UploadTableColumnType.FLOAT: sa_types.Float(),
    UploadTableColumnType.INTEGER: sa_types.Integer(),
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

    def _get_df_dtypes(self):
        colname_to_dtypes = {}
        for col_name, col_type in self._table_config["column_name_types"]:
            if is_custom_column_type(col_type):
                raise Exception(
                    "SQLAlchemy based table upload does not support custom column type"
                )
            colname_to_dtypes[col_name] = UPLOADED_TABLE_COL_TYPE_TO_SQLALCHEMY_TYPE[
                UploadTableColumnType(col_type)
            ]

        return colname_to_dtypes

    def _get_pandas_to_sql_config(self):
        connection = self._get_sqlalchemy_connection()

        config = {
            "name": self._table_config["table_name"],
            "schema": self._table_config.get("schema_name", None),
            "con": connection,
            "if_exists": self._table_config.get("if_exists", "fail"),
            "index": False,
            "chunksize": 10000,
            "dtype": self._get_df_dtypes(),
        }

        return config

    def _upload(self) -> Tuple[str, str]:
        df = self._importer.get_pandas_df()
        df.rename(
            {
                idx: col_name
                for idx, (col_name, _) in enumerate(
                    self._table_config["column_name_types"]
                )
            }
        )

        config = self._get_pandas_to_sql_config()
        df.to_sql(**config)
