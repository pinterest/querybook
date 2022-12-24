from app.datasource import register
from const.event_log import EventType
from lib.event_logger import event_logger


@register("/event_log/", methods=["POST"], api_logging=False)
def log_track_event(event_type: str, event_data: dict):
    event_logger.log(event_type=EventType(event_type), event_data=event_data)
