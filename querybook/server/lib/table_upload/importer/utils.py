import numpy as np
from lib.table_upload.common import UploadTableColumnType


dtype_to_upload_column_type = {
    np.dtype("bool"): UploadTableColumnType.BOOLEAN,
    np.dtype("float64"): UploadTableColumnType.FLOAT,
    np.dtype("int64"): UploadTableColumnType.INTEGER,
    np.dtype("object"): UploadTableColumnType.STRING,
}


def pandas_dtype_upload_type(dtype) -> UploadTableColumnType:
    return dtype_to_upload_column_type.get(dtype, UploadTableColumnType.STRING)
