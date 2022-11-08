from enum import Enum


class EventType(Enum):
    # an api request
    API = "api"
    # a UI element gets viewed
    VIEW = "view"
    # a UI element gets clicked
    CLICK = "click"
