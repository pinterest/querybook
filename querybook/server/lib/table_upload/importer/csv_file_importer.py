from typing import Dict, List

import pandas as pd

from lib.table_upload.importer.utils import get_pandas_upload_type_by_dtype
from .base_importer import BaseTableUploadImporter

default_csv_parsing_config = {
    "delimiter": ",",
    "first_row_column": True,
    "skip_rows": 0,
}


class CSVFileImporter(BaseTableUploadImporter):
    def __init__(self, data, import_config: Dict = None):
        super().__init__(data, {**default_csv_parsing_config, **(import_config or {})})
        self._df = None

    def _get_pandas_read_csv_config(self):
        import_config = self.import_config

        first_row_column = import_config["first_row_column"]
        col_names = None if first_row_column else import_config["col_names"].split(",")

        config = {
            # Convert something like "\\t" to "\t"
            "sep": import_config["delimiter"]
            .encode("raw_unicode_escape")
            .decode("unicode_escape"),
            "header": 0 if first_row_column else None,
            "names": col_names,
            "skiprows": import_config["skip_rows"],
            "skip_blank_lines": import_config["skip_blank_lines"],
            "nrows": import_config["max_rows"],
            "skipinitialspace": import_config["skip_initial_space"],
        }
        return config

    def get_pandas_df(self):
        if self._df is None:
            read_csv_config = self._get_pandas_read_csv_config()

            self._df = pd.read_csv(self.data, **read_csv_config)
        return self._df

    def get_columns(self):
        df = self._df
        if df is None:
            read_csv_config = self._get_pandas_read_csv_config()
            read_csv_config["nrows"] = 5  # limit the amount of data to read

            # FIXME: If we want to support get_columns then get_pandas_df
            # We should consider resetting the read, something like self.data.seek(0)
            df = pd.read_csv(self.data, **read_csv_config)

        column_names: List[str] = list(df.columns)
        column_pd_types = [
            get_pandas_upload_type_by_dtype(dtype) for dtype in df.dtypes
        ]

        return list(zip(column_names, column_pd_types))
