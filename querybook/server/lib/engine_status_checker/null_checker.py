from .base_checker import BaseEngineStatusChecker, EngineStatus
from const.query_execution import QueryEngineStatus


class NullChecker(BaseEngineStatusChecker):
    @classmethod
    def NAME(cls) -> str:
        return "NullChecker"

    @classmethod
    def check(cls, engine_id: int, uid: int) -> EngineStatus:
        """Perform the check
        Override if you want custom results
        """
        return {"status": QueryEngineStatus.UNAVAILABLE.value, "messages": []}
