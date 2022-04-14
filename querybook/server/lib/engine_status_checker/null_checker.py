from typing import Dict
from .base_checker import BaseEngineStatusChecker, EngineStatus
from const.query_execution import QueryEngineStatus


class NullChecker(BaseEngineStatusChecker):
    @classmethod
    def NAME(cls) -> str:
        return "NullChecker"

    @classmethod
    def perform_check_with_executor(
        cls, executor, executor_params: Dict, _engine_dict: Dict
    ) -> EngineStatus:
        """
        This checker performs NOOP check
        """
        return {"status": QueryEngineStatus.UNAVAILABLE.value, "messages": []}
