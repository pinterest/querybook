from const.event_log import EventType
from lib.event_logger.base_event_logger import BaseEventLogger


class NullEventLogger(BaseEventLogger):
    """An event logger which does nothing."""

    @property
    def logger_name(self) -> str:
        return "null"

    def log(
        self, uid: int, event_type: EventType, event_data: dict, timestamp: int = None
    ) -> None:
        pass
