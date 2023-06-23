import flask
import json

from app.datasource import register
from const.event_log import EventType
from lib.event_logger import event_logger


@register("/context_log/", methods=["POST"], api_logging=False)
def log_frontend_event():
    """Log a list of frontend events sent from `navigator.sendBeacon()`

    The flask.requset.data is stringified list[FrontendEvent]

    As flask.request.is_json is False for requests send from `navigator.sendBeacon()`,
    we are parsing the data directly here instead of relying on `@register` to parse it.
    """
    events = json.loads(flask.request.data)
    for event in events:
        event_logger.log(
            event_type=EventType(event["type"]),
            event_data=event["data"],
            timestamp=event["timestamp"],
        )
