from typing import Tuple
import pandas as pd

from app.db import with_session
from lib.utils.execute_query import execute_query
from lib.table_upload.common import ImporterResourceType
from querybook.server.env import QuerybookSettings
from .base_exporter import BaseTableUploadExporter

S3_OBJECT_KEY_NOT_ALLOWED_CHAR = r"[^\w-]+"


class S3Exporter(BaseTableUploadExporter):
    def _destination_s3_path(self) -> str:
        upload_s3_path = QuerybookSettings.TABLE_UPLOAD_S3_PATH
        schema_name, table_name = self._fq_table_name
        object_key = S3_OBJECT_KEY_NOT_ALLOWED_CHAR.sub(
            "", f"{schema_name}-{table_name}"
        )
        return upload_s3_path + object_key

    def _copy_to_s3(self, resource_path: str):
        pass

    def _df_to_s3(self, df: pd.DataFrame):
        pass

    @with_session
    def _upload_to_s3(self, session=None):
        importer = self._importer
        resource_type, resource_path = importer.get_resource_path()

        # If from s3 -> s3 is possible, do copy which is a lot faster
        if resource_type == ImporterResourceType.S3:
            self._copy_to_s3(resource_path)
        else:
            # Otherwise use Pandas DF to do all the work
            self._df_to_s3(importer.get_pandas_df())

    @with_session
    def _verify_table_exists(self, session=None):
        if_exists = self._table_config["if_exists"]
        if if_exists == "append":
            raise Exception("Cannot use append for S3 table export")

        table_id = self._sync_table_from_metastore(session=session)
        if table_id is not None:
            schema_name, table_name = self._fq_table_name
            fq_table_name = f"{schema_name}.{table_name}"

            if if_exists == "fail":
                raise Exception(f"Table {fq_table_name} already exists")
            elif if_exists == "replace":
                self._run_query(
                    f"DROP TABLE IF EXISTS {fq_table_name}", session=session
                )

    def _get_table_create_query(self) -> str:
        pass

    @with_session
    def _run_query(self, query: str, session=None):
        execute_query(query, self._engine_id, self._uid, session=session)

    @property
    def _fq_table_name(self):
        return (self._table_config["schema_name"], self._table_config["table_name"])

    @with_session
    def _upload(self, session=None) -> Tuple[str, str]:
        self._verify_table_exists(session=session)
        self._upload_to_s3(session=session)
        self._run_query(self._get_table_create_query(), session=session)

        return self._fq_table_name
