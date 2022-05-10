from typing import Tuple
import re

import pandas as pd
import numpy as np

from app.db import with_session
from clients.s3_client import S3FileCopier
from clients.s3_client import MultiPartUploader
from env import QuerybookSettings

from lib.utils.execute_query import execute_query
from lib.table_upload.common import ImporterResourceType
from logic.admin import get_query_engine_by_id
from lib.query_analysis.create_table.create_table import (
    get_external_create_table_statement,
)
from .base_exporter import BaseTableUploadExporter

S3_OBJECT_KEY_NOT_ALLOWED_CHAR = r"[^\w-]+"


class S3Exporter(BaseTableUploadExporter):
    def _destination_s3_path(self) -> str:
        return self._destination_s3_folder() + "/" + "0000"

    def _destination_s3_folder(self) -> str:
        schema_name, table_name = self._fq_table_name
        object_key = re.sub(
            S3_OBJECT_KEY_NOT_ALLOWED_CHAR, "", f"{schema_name}/{table_name}"
        )
        return QuerybookSettings.TABLE_UPLOAD_S3_PATH + object_key

    def _copy_to_s3(self, resource_path: str):
        S3FileCopier(resource_path).copy_to(self._destination_s3_path())

    def _df_to_s3(self, df: pd.DataFrame):
        MULTI_UPLOADER_CHUNK_SIZE = 500

        bucket, key = S3FileCopier.s3_path_to_bucket_key(self._destination_s3_path())
        s3_uploader = MultiPartUploader(bucket, key)
        for chunk_no, sub_df in df.groupby(
            np.arange(len(df)) // MULTI_UPLOADER_CHUNK_SIZE
        ):
            s3_uploader.write(sub_df.to_csv(index=False, header=(chunk_no == 0)))
        s3_uploader.complete()

    def _upload_to_s3(self):
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

    @with_session
    def _get_table_create_query(self, session=None) -> str:
        query_engine = get_query_engine_by_id(self._engine_id, session=session)
        schema_name, table_name = self._fq_table_name
        return get_external_create_table_statement(
            query_engine.language,
            table_name,
            self._table_config["column_name_types"],
            self._destination_s3_folder(),
            schema_name,
            "TEXTFILE",
        )

    @with_session
    def _run_query(self, query: str, session=None):
        execute_query(query, self._engine_id, self._uid, session=session)

    @property
    def _fq_table_name(self):
        return (self._table_config["schema_name"], self._table_config["table_name"])

    @with_session
    def _upload(self, session=None) -> Tuple[str, str]:
        self._verify_table_exists(session=session)
        self._upload_to_s3()
        self._run_query(self._get_table_create_query(session=session), session=session)

        return self._fq_table_name
