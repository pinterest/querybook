from abc import ABCMeta, abstractclassmethod
from typing import List
from typing_extensions import TypedDict
from datetime import datetime

from const.query_execution import QueryEngineStatus
from lib.utils.mysql_cache import get_raw_key, set_key
from lib.utils.utils import DATETIME_TO_UTC
from tasks.poll_engine_status import poll_engine_status


class EngineStatus(TypedDict):
    status: QueryEngineStatus

    # The str here will be parsed as html in the frontend
    messages: List[str] = []


class BaseEngineStatusChecker(metaclass=ABCMeta):
    @abstractclassmethod
    def NAME(cls) -> str:
        """Name of the checker that will be shown on the frontend"""
        raise NotImplementedError()

    @classmethod
    def check(cls, engine_id: int, uid: int) -> EngineStatus:
        """Perform the check
        Override if you want custom results
        """
        return cls.get_server_status(engine_id)

    """
    This section of code is relevant if you want to cache server
    check results and let users read the same check result.

    The checker checks server status and caches it in key value store.
    This is optional for any engine status checker if they want to use
    celery to query and cache the results in the backend
    """

    @abstractclassmethod
    def _perform_check(cls, engine_id: int) -> EngineStatus:
        """Perform the check"""
        raise NotImplementedError()

    @classmethod
    def get_server_status_task(cls, engine_id: int) -> None:
        """This function runs in celery and set the cache"""
        result = cls._perform_check(engine_id)
        key = cls.generate_server_check_cache_key(engine_id)
        set_key(key, result)

    @classmethod
    def get_server_status(cls, engine_id) -> EngineStatus:
        result: EngineStatus = {
            "status": QueryEngineStatus.UNAVAILABLE.value,
            "messages": [],
        }
        key = cls.generate_server_check_cache_key(engine_id)

        cache_updated_at = None
        try:
            raw_cache = get_raw_key(key)
            if raw_cache is not None:
                result = raw_cache["value"]
                cache_updated_at = raw_cache["updated_at"]
        except LookupError:
            pass  # Unable to get key

        if (
            cache_updated_at is None
            or DATETIME_TO_UTC(datetime.utcnow()) - cache_updated_at
            > cls.SERVER_RESULT_EXPIRY()
        ):

            # Result was expired, getting a new one
            poll_engine_status.delay(cls.NAME(), engine_id)
        return result

    @classmethod
    def generate_server_check_cache_key(cls, engine_id):
        return f"ENGINE_STATUS_CHECK:{engine_id}"

    @classmethod
    def SERVER_RESULT_EXPIRY(cls) -> int:
        """Number of seconds before server query result expires"""
        return 60
