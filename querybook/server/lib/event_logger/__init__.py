from flask_login import current_user

from const.event_log import EventType
from env import QuerybookSettings
from lib.event_logger.all_event_loggers import (
    get_event_logger_class,
    DEFAULT_EVENT_LOGGER,
)


class EventLogger:
    def __init__(self):
        logger_name = QuerybookSettings.EVENT_LOGGER_NAME
        logger_name = "console"

        if logger_name:
            self.logger = get_event_logger_class(logger_name)
        else:
            self.logger = DEFAULT_EVENT_LOGGER

    def log(
        self,
        event_type: EventType,
        event_data: dict,
    ):
        self.logger.log(
            uid=current_user.id, event_type=event_type, event_data=event_data
        )

    def log_api_request(self, method: str, path: str, params: dict):
        """Log an API request

        Args:
            method (str): request method, e.g. GET, POST
            path (str): request path
            params (dict): params of a GET request
        """
        event_data = {"method": method, "path": path, "params": params}
        self.log(event_type=EventType.API, event_data=event_data)


event_logger = EventLogger()
