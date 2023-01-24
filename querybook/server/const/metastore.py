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
    # Metadata will be read-only on Querybook UI and it will redirect to the metastore link for editing.
    READ_ONLY = "read_only"

    # On saving, metadata will only be written back querybook db. This is the default mode if not specified.
    WRITE_BACK = "write_back"

    # On saving, metadata will be written back to metastore, as well as querybook db
    WRITE_THROUGH = "write_through"


class MetastoreLoaderConfig:
    """Config to set the read/write mode (MetadataMode) for each metadata."""

    def __init__(self, config: dict[MetadataType, MetadataMode]):
        self._config = config

    def to_dict(self):
        return {key.value: value.value for (key, value) in self._config.items()}
