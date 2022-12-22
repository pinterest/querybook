from enum import Enum


class EventType(Enum):
    # an api request
    API = "api"
    # websocket event
    WEBSOCKET = "websocket"
    # a UI element gets viewed
    VIEW = "view"
    # a UI element gets clicked
    CLICK = "click"
