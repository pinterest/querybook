from enum import Enum
from typing import NamedTuple, TypedDict, Optional, Union


# Keep it in sync with DataElementAssociationType in const/dataElement.ts
class DataElementAssociationType(Enum):
    REF = "ref"
    ARRAY = "array"
    MAP = "map"
    # below types are just placeholders and are not used for now.
    STRUCT = "struct"
    UNION = "union"


class DataElementAssociationProperty(Enum):
    # "key" is only for the "map" association type
    KEY = "key"
    # all association types will have the "value" property
    VALUE = "value"


# Below types are used for representing data elements sending to frontend through API

# Keep it in sync with IDataElement in const/dataElement.ts
class DataElementDict(TypedDict):
    id: int
    name: str
    type: str
    description: str
    properties: Optional[dict[str, str]]


# Keep it in sync with IDataElementAssociation in const/dataElement.ts
class DataElementAssociationDict(TypedDict):
    type: str
    key: Optional[Union[DataElementDict, str]]
    value: Union[DataElementDict, str]


# Below types are used for representing data elements from metastore


class DataElementTuple(NamedTuple):
    name: str
    type: str
    description: str
    properties: dict
    created_by: str = None  # user/group name


class DataElementAssociationTuple(NamedTuple):
    # association type
    type: DataElementAssociationType
    # data element tuple or name. required for all association types
    value_data_element: Union[DataElementTuple, str]
    # for map association, value can either be a data element or a primitive type, e.g. i32
    value_primitive_type: str = None
    # data element tuple or name. required if associtaion type is map
    key_data_element: Union[DataElementTuple, str] = None
    # for map association, key can either be a data element or a primitive type, e.g. i32
    key_primitive_type: str = None
