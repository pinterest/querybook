from flask_login import current_user

from const.event_log import EventType
from env import QuerybookSettings
from lib.event_logger.all_event_loggers import get_event_logger_class
from lib.logger import get_logger

LOG = get_logger(__file__)


class EventLogger:
    def __init__(self):
        logger_name = QuerybookSettings.EVENT_LOGGER_NAME
        self.logger = get_event_logger_class(logger_name)

    def log(self, event_type: EventType, event_data: dict, timestamp: int = None):
        try:
            # default uid 0 if we cant get the current user
            uid = current_user.id if current_user else 0
            self.logger.log(
                uid=uid,
                event_type=event_type,
                event_data=event_data,
                timestamp=timestamp,
            )
        except Exception as e:
            # catch any potential exceptions to avoid event logging
            # from interrupting the normal flow
            LOG.error(e, exc_info=True)

    def log_api_request(self, route: str, method: str, params: dict):
        try:
            if current_user.is_authenticated:
                self.logger.log_api_request(
                    uid=current_user.id, route=route, method=method, params=params
                )
        except Exception as e:
            LOG.error(e, exc_info=True)

    def log_websocket_event(self, route: str, args: list, kwargs: dict):
        try:
            self.logger.log_websocket_event(
                uid=current_user.id, route=route, args=args, kwargs=kwargs
            )
        except Exception as e:
            LOG.error(e, exc_info=True)


event_logger = EventLogger()
