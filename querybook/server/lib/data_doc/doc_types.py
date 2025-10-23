from typing import Optional, TypedDict, Union, Literal


class DataDocMetaVarConfig(TypedDict):
    name: str
    value: Union[str, int, float, bool]
    type: Literal["boolean", "number", "string"]


class DataDocMeta(TypedDict):
    variables: list[DataDocMetaVarConfig]


class DataDocTitleGenerationCellContent(TypedDict):
    type: str
    title: Optional[str]
    content: str
