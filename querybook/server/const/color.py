from typing import TypedDict


class PaletteColor(TypedDict):
    name: str
    # color in hex format, e.g. #4287f5
    color: str
    fillColor: str
