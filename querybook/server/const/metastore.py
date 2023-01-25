from enum import Enum


class DataTableWarningSeverity(Enum):
    WARNING = 0
    ERROR = 1


class MetadataType(Enum):
    TABLE_DESCRIPTION = "table_description"
    COLUMN_DESCRIPTION = "column_description"
    OWNER = "owner"
    TAG = "tag"


class MetadataMode(Enum):
    # Metadata will be read-only on Querybook UI and it will redirect to the metastore link for editing.
    READ_ONLY = "read_only"

    # On saving, metadata will only be written to querybook db. This is the default mode if not specified.
    WRITE_LOCAL = "write_local"

    # On saving, metadata will be written back to metastore, as well as querybook db
    WRITE_BACK = "write_back"


class MetastoreLoaderConfig:
    """Config to set the read/write mode (MetadataMode) for each metadata."""

    _default_config = {
        MetadataType.TABLE_DESCRIPTION: MetadataMode.WRITE_LOCAL,
        MetadataType.COLUMN_DESCRIPTION: MetadataMode.WRITE_LOCAL,
        MetadataType.OWNER: MetadataMode.WRITE_LOCAL,
        MetadataType.TAG: MetadataMode.WRITE_LOCAL,
    }

    def __init__(self, config: dict[MetadataType, MetadataMode]):
        self._config = {**self._default_config, **config}

    def to_dict(self):
        return {key.value: value.value for (key, value) in self._config.items()}
