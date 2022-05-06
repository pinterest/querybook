from enum import Enum


class ImporterResourceType(Enum):
    NONE = 0
    S3 = 1
    GCS = 2


class UploadTableColumnType(str, Enum):
    FLOAT = "float"
    STRING = "string"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    DATETIME = "datetime"
