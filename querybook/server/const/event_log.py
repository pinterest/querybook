from enum import Enum
from typing import TypedDict


class EventType(Enum):
    # an api request
    API = "API"
    # websocket event
    WEBSOCKET = "WEBSOCKET"
    # a UI element gets viewed
    VIEW = "VIEW"
    # a UI element gets clicked
    CLICK = "CLICK"


class FrontendEvent(TypedDict):
    timestamp: int
    event_data: dict
    event_type: str  # value of EventType
