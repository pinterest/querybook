from enum import Enum


class EventType(Enum):
    # an api request
    API = "API"
    # websocket event
    WEBSOCKET = "WEBSOCKET"
    # a UI element gets viewed
    VIEW = "VIEW"
    # a UI element gets clicked
    CLICK = "CLICK"
