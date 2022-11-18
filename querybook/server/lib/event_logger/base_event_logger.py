from abc import ABC, abstractmethod

from const.event_log import EventType


MAX_STR_PARAM_LENGTH = 128


class BaseEventLogger(ABC):
    """Base interface for event logger"""

    @property
    @abstractmethod
    def logger_name(self) -> str:
        """Name of the event logger that will be shown on the frontend"""
        raise NotImplementedError()

    @property
    def api_allow_list(self) -> list:
        """API endpoints from this list will be logged.
        If None is returned, all endpoints will be loggeed.

        You can override this property to provide your own list in your logger.
        """
        return None

    @property
    def api_block_list(self) -> list:
        """API endpoints from this list will not be logged. This list will only be used
        when the allow list is None.

        You can override this property to provide your own list in your logger.
        """
        return [
            {"type": "prefix", "route": "/admin", "method": "GET"},
            {"type": "exact", "route": "/login/", "method": "POST"},
            {"type": "exact", "route": "/signup/", "method": "POST"},
        ]

    def should_log_api_request(self, route, method) -> bool:
        """Check whether this api request should be logged or not. It will honor the allow list
        first and then the block list. You can override this method in the sub class to provide
        your owner checker.

        Returns:
            bool: True to log, False to skip.
        """
        if self.api_allow_list is not None:
            for api in self.api_allow_list:
                if api["method"] != method:
                    continue

                if api["type"] == "prefix" and route.startswith(api["route"]):
                    return True
                elif api["type"] == "exact" and route == api["route"]:
                    return True

            return False

        if self.api_block_list is not None:
            for api in self.api_block_list:
                if api["method"] != method:
                    continue

                if api["type"] == "prefix" and route.startswith(api["route"]):
                    return False
                elif api["type"] == "exact" and route == api["route"]:
                    return False

        return True

    @abstractmethod
    def log(self, uid: int, event_type: EventType, event_data: dict) -> None:
        """Log an event to some data store

        Args:
            uid (int): id of the user who performed the action
            event_type (EventType): action event type, e.g. CLICK, VIEW
            event_data (dict): addtional info of the event in JSON format.
        """
        raise NotImplementedError()

    def log_api_request(self, uid: int, route: str, method: str, params: dict) -> None:
        """Log an API request.

        Args:
            method (str): request method, e.g. GET, POST
            route (str): route of the api endpoint which serves the request
            params (dict): params of the request, includes path params,
                query strings and post body
        """
        if not self.should_log_api_request(route, method):
            return

        params = self.__prune_api_request_params(params)
        event_data = {"method": method, "route": route, "params": params}
        self.log(uid=uid, event_type=EventType.API, event_data=event_data)

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
