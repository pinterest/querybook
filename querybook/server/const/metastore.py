from enum import Enum
from typing import NamedTuple, TypedDict

from .data_element import DataElementAssociationTuple


class DataSchema(NamedTuple):
    name: str


class DataTableLink(TypedDict):
    url: str
    label: str


class DataTag(NamedTuple):
    name: str
    # below properties will be stored in tag.meta
    type: str = None
    description: str = None
    # color in hex format, e.g. #4287f5
    color: str = None


class DataOwnerType(NamedTuple):
    name: str
    # It will be rendered as the field label in the detailed table view
    display_name: str
    description: str = None


class DataOwner(NamedTuple):
    username: str
    # If provided, the type here must be one of the type names from metastore loader
    type: str = None


class DataTableWarningSeverity(Enum):
    WARNING = 0
    ERROR = 1


class DataTable(NamedTuple):
    name: str

    # The type of table, it can be an arbitrary string
    type: str = None

    # This is the legacy field, which will be replaced by owners field below.
    owner: str = None
    # list of owner usernames
    owners: list[DataOwner] = []

    # description from metastore, expect HTML format
    description: str = None

    # list of tags
    tags: list[DataTag] = []

    # Expected in UTC seconds
    table_created_at: int = None
    table_updated_at: int = None
    table_updated_by: str = None

    # size of table
    data_size_bytes: int = None
    # Location of the raw file
    location: str = None

    # Json arrays of partitions
    partitions: list[str] = []
    earliest_partitions: list[str] = None
    latest_partitions: list[str] = None

    # Store the raw info here
    raw_description: str = None

    # Arrays of partition keys
    partition_keys: list[str] = []

    # Custom properties
    custom_properties: dict[str, str] = None

    # Links associated to table
    table_links: list[DataTableLink] = None

    golden: bool = False
    boost_score: float = 1

    # table warnings
    warnings: list[tuple[DataTableWarningSeverity, str]] = None


class DataColumn(NamedTuple):
    name: str
    type: str

    # column comment from sql query when creating the table
    comment: str = None

    # user edited description from metastore, expect HTML format
    description: str = None

    # list of column level tags from metastore
    tags: list[DataTag] = []

    # data element
    data_element: DataElementAssociationTuple = None


class MetadataType(Enum):
    TABLE_DESCRIPTION = "table_description"
    COLUMN_DESCRIPTION = "column_description"
    OWNER = "owner"
    TAG = "tag"
    DATA_ELEMENT = "data_element"


class MetadataMode(Enum):
    # Metadata will be read-only on Querybook UI and it will redirect to the metastore link for editing.
    READ_ONLY = "read_only"

    # On saving, metadata will only be written to querybook db. This is the default mode if not specified.
    # It also indicates that it will not load this metadata from the metastore.
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

    def can_load_external_metadata(self, metadataType: MetadataType) -> bool:
        """Check if the given metadata type will be loaded from metastore"""
        return self._config.get(metadataType, MetadataMode.WRITE_LOCAL) in (
            MetadataMode.READ_ONLY,
            MetadataMode.WRITE_BACK,
        )

    def to_dict(self):
        return {key.value: value.value for (key, value) in self._config.items()}
