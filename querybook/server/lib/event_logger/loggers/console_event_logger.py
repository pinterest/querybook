from datetime import datetime

from const.event_log import EventType
from lib.event_logger.base_event_logger import BaseEventLogger
from lib.logger import get_logger

LOG = get_logger(__file__)

COLOR_YELLOW = "\x1b[33;20m"
COLOR_RESET = "\x1b[0m"


class ConsoleEventLogger(BaseEventLogger):
    """Print event logs to console. This is more for debugging purpose."""

    @property
    def logger_name(self) -> str:
        return "console"

    def log(
        self, uid: int, event_type: EventType, event_data: dict, timestamp: int = None
    ):
        now = (
            datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            if timestamp is None
            else datetime.utcfromtimestamp(timestamp / 1000).strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )
        event = f"created_at: {now}, uid={uid}, event_type={event_type}, event_data={event_data}"

        LOG.info(f"{COLOR_YELLOW}{self.__class__.__name__} - {event}{COLOR_RESET}")
