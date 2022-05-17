from typing import List, Tuple
import pandas as pd
import numpy as np

from lib.query_analysis.create_table.helper import is_custom_column_type
from lib.table_upload.common import UploadTableColumnType

UPLOADED_TABLE_COL_TYPE_TO_PANDAS_TYPE = {
    UploadTableColumnType.BOOLEAN: bool,
    UploadTableColumnType.DATETIME: np.datetime64,
    UploadTableColumnType.STRING: str,
    UploadTableColumnType.FLOAT: np.float64,
    UploadTableColumnType.INTEGER: np.int64,
}


def update_pandas_df_column_name_type(
    df: pd.DataFrame, column_name_types: List[Tuple[str, str]]
):
    # Rename Columns for DataFrame
    old_column_names = list(df.columns)
    renamed_df = df.rename(
        columns={
            old_column_names[idx]: col_name
            for idx, (col_name, _) in enumerate(column_name_types)
        }
    )

    # Cast new types
    colname_to_dtypes = {}
    for col_name, col_type in column_name_types:
        if is_custom_column_type(col_type):
            # Custom column type is not supported
            # We just let the data be kept as is and let the query engine
            # to understand it
            continue
        colname_to_dtypes[col_name] = UPLOADED_TABLE_COL_TYPE_TO_PANDAS_TYPE[
            UploadTableColumnType(col_type)
        ]

    retyped_df = renamed_df.astype(colname_to_dtypes)
    return retyped_df
