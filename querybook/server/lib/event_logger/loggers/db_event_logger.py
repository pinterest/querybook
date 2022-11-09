from const.event_log import EventType
from lib.event_logger.base_event_logger import BaseEventLogger
from lib.logger import get_logger
from models.event_log import EventLog

LOG = get_logger(__file__)


class DBEventLogger(BaseEventLogger):
    """Save event logs to querybook mysql db."""

    @property
    def logger_name(self) -> str:
        return "db"

    def log(self, uid: int, event_type: EventType, event_data: dict):
        EventLog.create(
            {"uid": uid, "event_type": event_type, "event_data": event_data}
        )
