from enum import Enum


class DataTableWarningSeverity(Enum):
    WARNING = 0
    ERROR = 1


class MetadataType(Enum):
    TABLE_DESCRIPTION = "table_description"
    COLUMN_DESCRIPTION = "column_description"
    OWNER = "owner"
    TAG = "tag"
    DOMAIN = "domain"


class MetadataMode(Enum):
    READ_ONLY = "read_only"  # metadata will be read-only on Querybook UI
    WRITE_BACK = "write_back"  # metadata will be written back to metastore on saving


class MetastoreLoaderConfig:
    """Config to control if the metadata can be edited or written back to metastore.
    The default behavior of a metadata type (not specifed in the config) is that
    it will be editable and only saved in qurybook db.
    """

    def __init__(self, config: dict[MetadataType, MetadataMode]):
        self._config = config

    def to_dict(self):
        return {key.value: value.value for (key, value) in self._config.items()}
