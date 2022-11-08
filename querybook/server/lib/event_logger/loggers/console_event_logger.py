from datetime import datetime

from const.event_log import EventType
from lib.event_logger.base_event_logger import BaseEventLogger

COLOR_YELLOW = "\x1b[33;20m"
COLOR_RESET = "\x1b[0m"


class ConsoleEventLogger(BaseEventLogger):
    """Print event logs to console. This is more for debugging purpose."""

    @property
    def logger_name(self) -> str:
        return "console"

    def log(self, uid: int, event_type: EventType, event_data: dict):
        now = datetime.utcnow().strftime("%Y-%m-%d %a %H:%M:%S")

        event = f"uid={uid}, event_type={event_type}, event_data={event_data}"
        print(
            f"{COLOR_YELLOW}{self.__class__.__name__} - [{now}] - {event}{COLOR_RESET}"
        )
