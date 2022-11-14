from flask_login import current_user

from const.event_log import EventType
from env import QuerybookSettings
from lib.event_logger.all_event_loggers import get_event_logger_class
from lib.logger import get_logger

LOG = get_logger(__file__)

MAX_STR_PARAM_LENGTH = 128


class EventLogger:
    def __init__(self):
        logger_name = QuerybookSettings.EVENT_LOGGER_NAME
        self.logger = get_event_logger_class(logger_name)

    def log(
        self,
        event_type: EventType,
        event_data: dict,
    ):
        try:
            self.logger.log(
                uid=current_user.id, event_type=event_type, event_data=event_data
            )
        except Exception as e:
            # catch any potential exceptions to avoid event logging
            # from interrupting the normal flow
            LOG.error(e, exc_info=True)

    def log_api_request(self, route: str, method: str, params: dict):
        """Log an API request.

        Args:
            method (str): request method, e.g. GET, POST
            route (str): route of the api endpoint which serves the request
            params (dict): params of the request, includes path params,
                query strings and post body
        """
        params = self.__prune_api_request_params(params)
        event_data = {"method": method, "route": route, "params": params}
        self.log(event_type=EventType.API, event_data=event_data)

    def __prune_api_request_params(self, params: dict):
        """Trim str type params which has big size.

        Args:
            params (dict): api request params

        Returns:
            dict: a new params dict
        """
        new_params = {}
        for key, value in params.items():
            if isinstance(value, str) and len(value) > MAX_STR_PARAM_LENGTH:
                new_params[key] = value[:MAX_STR_PARAM_LENGTH] + "..."
                continue

            if isinstance(value, dict):
                new_params[key] = self.__prune_api_request_params(value)
            else:
                new_params[key] = value

        return new_params


event_logger = EventLogger()
