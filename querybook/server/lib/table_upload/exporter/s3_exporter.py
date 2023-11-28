import tempfile
from typing import Tuple
import re
from abc import abstractmethod

import pandas as pd
import numpy as np

from app.db import with_session
from clients.s3_client import S3FileCopier
from clients.s3_client import MultiPartUploader

from lib.utils.execute_query import ExecuteQuery
from lib.table_upload.common import ImporterResourceType
from logic.admin import get_query_engine_by_id
from lib.metastore import get_metastore_loader
from lib.query_analysis.create_table.create_table import (
    get_create_table_statement,
)
from lib.table_upload.exporter.utils import update_pandas_df_column_name_type
from lib.logger import get_logger

from .base_exporter import BaseTableUploadExporter

LOG = get_logger(__file__)


"""
    The S3BaseExporter (and its dervied child classes) support the following options
    - s3_path (str): if supplied, will use it as the root path for upload. Must be the full s3 path like s3://bucket/...
    - use_schema_location (bool):
        if true, the upload root path is inferred by locationUri specified in hms
        to use this option, the engine must be connected to a metastore that uses
        HMSMetastoreLoader (or its derived class)
        if false, it will be created as managed table, whose location will be determined automatically by the query engine.
    - table_properties (List[str]): list of table properties passed, this must be query engine specific.
        Checkout here for examples in SparkSQL: https://spark.apache.org/docs/latest/sql-ref-syntax-ddl-create-table-hiveformat.html#examples
        For Trino/Presto, it would be the WITH statement: https://trino.io/docs/current/sql/create-table.html

    If neither s3_path nor use_schema_location is provided, it will be treated same as `use_schema_location=False``,
    and it will be created as managed table.
"""


class S3BaseExporter(BaseTableUploadExporter):
    @abstractmethod
    def UPLOAD_FILE_TYPE(cls) -> str:
        """Override this to specify what kind of file is getting uploaded

        Returns:
            str: Example: 'CSV' or 'PARQUET'
        """
        return NotImplementedError()

    @abstractmethod
    def _upload_to_s3(self) -> None:
        """Override this to upload the importer data to s3 location
        specified by destination_s3_path

        """
        raise NotImplementedError()

    @with_session
    def destination_s3_path(self, session=None) -> str:
        return self.destination_s3_folder(session=session) + "/" + "0000"

    @with_session
    def destination_s3_folder(self, session=None) -> str:
        """Generate the s3 folder path for the table

        Returns:
            str: s3 path consisting bucket + prefix + schema name + table name
        """

        schema_name, table_name = self._fq_table_name
        if "s3_path" in self._exporter_config:
            s3_path: str = self._exporter_config["s3_path"]
            return sanitize_s3_url(s3_path) + "/" + schema_name + "/" + table_name

        query_engine = get_query_engine_by_id(self._engine_id, session=session)
        metastore = get_metastore_loader(query_engine.metastore_id, session=session)

        if metastore is None:
            raise Exception("Invalid metastore for table upload")

        if self._exporter_config.get("use_schema_location", False):
            schema_location_uri = metastore.get_schema_location(schema_name)
            if not schema_location_uri:
                raise Exception("Invalid metastore to use use_schema_location option")

            return sanitize_s3_url(schema_location_uri) + "/" + table_name

        # Use its actual location for managed tables
        table_location = metastore.get_table_location(schema_name, table_name)

        if not table_location:
            raise Exception(
                "Cant get the table location from metastore. Please make sure the query engine supports managed table with default location."
            )
        return sanitize_s3_url(table_location)

    @with_session
    def _handle_if_table_exists(self, session=None):
        if_exists = self._table_config["if_exists"]
        schema_name, table_name = self._fq_table_name
        fq_table_name = f"{schema_name}.{table_name}"

        if if_exists == "append":
            raise Exception("Cannot use append for S3 table export")

        table_exists = self._check_if_table_exists(session=session)
        if table_exists:
            if if_exists == "replace":
                self._run_query(
                    f"DROP TABLE IF EXISTS {fq_table_name}", session=session
                )
            elif if_exists == "fail":
                raise Exception(f"Table {fq_table_name} already exists.")

    @with_session
    def _get_table_create_query(self, session=None) -> str:
        query_engine = get_query_engine_by_id(self._engine_id, session=session)
        schema_name, table_name = self._fq_table_name
        is_external = "s3_path" in self._exporter_config or self._exporter_config.get(
            "use_schema_location"
        )
        return get_create_table_statement(
            language=query_engine.language,
            table_name=table_name,
            schema_name=schema_name,
            column_name_types=self._table_config["column_name_types"],
            # table location is only needed for external (non managed) table creation
            file_location=self.destination_s3_folder() if is_external else None,
            file_format=self.UPLOAD_FILE_TYPE(),
            table_properties=self._exporter_config.get("table_properties", []),
        )

    @with_session
    def _run_query(self, query: str, session=None):
        # Poll frequently since create table should finish quickly
        ExecuteQuery(False, poll_interval=1)(
            query, self._engine_id, self._uid, session=session
        )

    @property
    def _fq_table_name(self):
        return (self._table_config["schema_name"], self._table_config["table_name"])

    @with_session
    def _upload(self, session=None) -> Tuple[str, str]:
        self._handle_if_table_exists(session=session)

        create_table_query = self._get_table_create_query(session=session)

        # Run the create table query first, since table creation
        # does not require the data being there
        self._run_query(create_table_query, session=session)
        self._upload_to_s3()
        return self._fq_table_name


class S3CSVExporter(S3BaseExporter):
    def UPLOAD_FILE_TYPE(cls):
        return "CSV"

    def _copy_to_s3(self, resource_path: str):
        S3FileCopier.from_querybook_bucket(resource_path).copy_to(
            self.destination_s3_path()
        )

    def _df_to_s3(self, df: pd.DataFrame):
        MULTI_UPLOADER_CHUNK_SIZE = 500

        bucket, key = S3FileCopier.s3_path_to_bucket_key(self.destination_s3_path())
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


class S3ParquetExporter(S3BaseExporter):
    def destination_s3_path(self) -> str:
        return super(S3ParquetExporter, self).destination_s3_path() + ".parquet"

    def UPLOAD_FILE_TYPE(cls):
        return "PARQUET"

    def _upload_to_s3(self) -> None:
        df = update_pandas_df_column_name_type(
            self._importer.get_pandas_df(), self._table_config["column_name_types"]
        )

        with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
            df.to_parquet(f.name, index=False, compression="zstd")
            S3FileCopier.from_local_file(f).copy_to(self.destination_s3_path())


def sanitize_s3_url(uri: str) -> str:
    """
    This function does two things:
    1. if the uri is s3a:// or s3n://, change it to s3://
    2. remove the trailing slash if it has one
    """
    uri = re.sub(r"^s3[a-z]:", "s3:", uri)
    if uri.endswith("/"):
        uri = uri[:-1]
    return uri
