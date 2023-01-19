from app.datasource import register
from const.event_log import EventType, FrontendEvent
from lib.event_logger import event_logger


@register("/context_log/", methods=["POST"], api_logging=False)
def log_frontend_event(events: list[FrontendEvent]):
    """Log a list of frontend events.

    Args:
        events (list[FrontendEvent]): a list of frontend events
    """
    for event in events:
        event_logger.log(
            event_type=EventType(event["type"]),
            event_data=event["data"],
            timestamp=event["timestamp"],
        )
