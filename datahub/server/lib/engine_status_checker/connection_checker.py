from datetime import datetime

from app.db import DBSession
from .base_checker import BaseEngineStatusChecker, EngineStatus
from const.query_execution import QueryEngineStatus
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.all_executors import get_executor_class

from lib.utils.utils import Timeout
from logic.admin import get_query_engine_by_id


class ConnectionChecker(BaseEngineStatusChecker):
    @classmethod
    def NAME(cls) -> str:
        return "ConnectionChecker"

    @classmethod
    def _perform_check(cls, engine_id: int) -> EngineStatus:
        with DBSession() as session:
            engine = get_query_engine_by_id(engine_id, session=session)
            executor_name = engine.executor
            executor_params = engine.get_engine_params()

            return check_connection(get_executor_class(executor_name), executor_params)


def check_connection(
    executor: QueryExecutorBaseClass, client_settings: {}
) -> EngineStatus:
    result: EngineStatus = {"status": QueryEngineStatus.GOOD.value, "messages": []}
    try:
        with Timeout(20, "Connection took too long"):
            cursor = executor._get_client(client_settings).cursor()
            utc_now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            result["messages"].append(
                f"Connection check successed at {utc_now_str} UTC"
            )
            del cursor
    except Exception as e:
        result["status"] = QueryEngineStatus.ERROR.value
        result["messages"].append(str(e))

    return result
