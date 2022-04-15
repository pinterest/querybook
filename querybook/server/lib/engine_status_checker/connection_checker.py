from datetime import datetime
from typing import Dict

from .base_checker import BaseEngineStatusChecker, EngineStatus
from const.query_execution import QueryEngineStatus
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.utils.utils import Timeout


class ConnectionChecker(BaseEngineStatusChecker):
    @classmethod
    def NAME(cls) -> str:
        return "ConnectionChecker"

    @classmethod
    def perform_check_with_executor(
        cls, executor: QueryExecutorBaseClass, executor_params: Dict, _engine_dict: Dict
    ) -> EngineStatus:
        return check_connection(executor, executor_params)


def check_connection(
    executor: QueryExecutorBaseClass, client_settings: Dict
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
