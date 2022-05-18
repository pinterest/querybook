from itertools import islice
from typing import Optional

import pandas as pd

from app.db import with_session
from lib.export.exporters.python_exporter import PythonExporter
from lib.table_upload.importer.utils import get_pandas_upload_type_by_dtype
from lib.table_upload.common import ImporterResourceType
from logic.query_execution import (
    get_last_statement_execution_by_query_execution,
    get_statement_execution_by_id,
)
from lib.result_store import GenericReader

from .base_importer import BaseTableUploadImporter

STORE_TYPE_TO_RESOURCE_TYPE = {
    "s3": ImporterResourceType.S3,
    "gcs": ImporterResourceType.GCS,
}


class QueryExecutionImporter(BaseTableUploadImporter):
    def __init__(self, query_execution_id: int):
        super().__init__(query_execution_id, {})
        self._df = None
        # Used to get query results
        self._python_exporter = PythonExporter()
        self._statement_execution_id = None

    @property
    def statement_execution_id(self):
        if self._statement_execution_id is None:
            statement_execution = get_last_statement_execution_by_query_execution(
                self.data
            )
            if not statement_execution:
                raise ValueError(f"Invalid query execution id {self.data}")
            self._statement_execution_id = statement_execution.id

        return self._statement_execution_id

    @with_session
    def _get_statement_results_col_rows(
        self, num_rows: Optional[int] = None, session=None
    ):
        columns = self._python_exporter._get_statement_execution_cols(
            self.statement_execution_id, session=session
        )
        rows = self._python_exporter._get_statement_execution_result_iter(
            self.statement_execution_id, number_of_lines=num_rows, session=session
        )

        # Skip the first row, which is the colum n header
        sliced_rows = islice(rows, 1, None)
        return columns, sliced_rows

    def get_pandas_df(self):
        if self._df is None:
            columns, rows = self._get_statement_results_col_rows()
            self._df = pd.DataFrame(rows, columns=columns)
        return self._df

    def get_columns(self):
        df = self._df
        if df is None:
            column_names, rows = self._get_statement_results_col_rows(5)
            df = pd.DataFrame(rows, columns=column_names)

        column_pd_types = [
            get_pandas_upload_type_by_dtype(dtype) for dtype in df.dtypes
        ]
        return list(zip(column_names, column_pd_types))

    @with_session
    def get_resource_path(self, session=None):
        statement_execution = get_statement_execution_by_id(
            self.statement_execution_id, False, session=session
        )
        with GenericReader(statement_execution.result_path) as reader:
            store_type = reader.store_type
            resource_path = reader.uri
            resource_type = STORE_TYPE_TO_RESOURCE_TYPE.get(store_type, None)
            if resource_type:
                return [resource_type, resource_path]

        return [None, None]
