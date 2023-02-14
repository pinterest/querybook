from typing import NamedTuple, List


class DataSchema(NamedTuple):
    name: str


class DataTag(NamedTuple):
    name: str
    # below properties will be stored in tag.meta
    type: str = None
    description: str = None
    color: str = None


class DataTable(NamedTuple):
    name: str

    # The type of table, it can be an arbitrary string
    type: str = None
    owner: str = None

    # description from metastore, expect HTML format
    description: str = None

    # list of tags
    tags: List[DataTag] = []

    # Expected in UTC seconds
    table_created_at: int = None
    table_updated_at: int = None
    table_updated_by: str = None

    # size of table
    data_size_bytes: int = None
    # Location of the raw file
    location: str = None

    # Json arrays of partitions
    partitions: List = []

    # Store the raw info here
    raw_description: str = None

    # Arrays of partition keys
    partition_keys: List[str] = []

    # Custom properties
    custom_properties: dict[str, str] = None


class DataColumn(NamedTuple):
    name: str
    type: str

    # column comment from sql query when creating the table
    comment: str = None

    # user edited description from metastore, expect HTML format
    description: str = None
