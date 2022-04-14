from datetime import datetime
from typing import Dict

from .base_checker import BaseEngineStatusChecker, EngineStatus
from const.query_execution import QueryEngineStatus
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.base_client import CursorBaseClass
from lib.utils.utils import Timeout, TimeoutError


class SelectOneChecker(BaseEngineStatusChecker):
    @classmethod
    def NAME(cls) -> str:
        return "SelectOneChecker"

    @classmethod
    def perform_check_with_executor(
        cls, executor: QueryExecutorBaseClass, executor_params: Dict, _engine_dict: Dict
    ) -> EngineStatus:
        return check_select_one(executor, executor_params)


class WrongSelectOneException(Exception):
    pass


def check_select_one(
    executor: QueryExecutorBaseClass, client_settings: Dict
) -> EngineStatus:
    result: EngineStatus = {"status": QueryEngineStatus.GOOD.value, "messages": []}
    try:
        with Timeout(20, "Select 1 took too long"):
            cursor: CursorBaseClass = executor._get_client(client_settings).cursor()
            cursor.run("select 1")
            cursor.poll_until_finish()
            first_row = cursor.get_one_row()

            # Verify the correct data is returned
            if str(next(iter(first_row), None)) != "1":
                raise WrongSelectOneException("Select 1 did not return 1")

            # Record the success results
            utc_now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            result["messages"].append(f"Select 1 check successed at {utc_now_str} UTC")
    except WrongSelectOneException as e:
        result["status"] = QueryEngineStatus.WARN.value
        result["messages"].append(str(e))
    except (TimeoutError, Exception) as e:
        result["status"] = QueryEngineStatus.ERROR.value
        result["messages"].append(str(e))

    return result
