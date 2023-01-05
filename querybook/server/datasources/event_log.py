from app.datasource import register
from const.event_log import EventType
from lib.event_logger import event_logger


@register("/event_log/", methods=["POST"], api_logging=False)
def log_track_event(events: list):
    """Log a list of frontend tracking events.

    Args:
        events (list): Each event is type of { event_type: str, event_data: dict }
    """
    for event in events:
        event_logger.log(
            event_type=EventType(event.get("type")),
            event_data=event.get("data"),
            timestamp=event.get("timestamp"),
        )
