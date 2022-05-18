from lib.table_upload.common import UploadTableColumnType


def is_custom_column_type(col_type: str):
    try:
        UploadTableColumnType(col_type)
        return False
    except ValueError:
        return True
