from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List


class QueryValidationSeverity(Enum):
    ERROR = "error"
    WARNING = "warning"


class QueryValidationResult(object):
    def __init__(
        self,
        line: int,  # 0 based
        ch: int,  # location of the starting token
        severity: QueryValidationSeverity,
        message: str,
    ):
        self.line = line
        self.ch = ch
        self.severity = severity
        self.message = message

    def to_dict(self):
        return {
            "line": self.line,
            "ch": self.ch,
            "severity": self.severity.value,
            "message": self.message,
        }


class BaseQueryValidator(ABC):
    def __init__(self, name: str, config: Dict[str, Any] = {}) -> None:
        self._name = name
        self._config = config

    @abstractmethod
    def languages(self) -> List[str]:
        raise NotImplementedError()

    @abstractmethod
    def validate(
        self,
        query: str,
        uid: int,  # who is doing the syntax check
        engine_id: int,  # which engine they are checking against
    ) -> List[QueryValidationResult]:
        raise NotImplementedError()

    def to_dict(self):
        return {"name": self._name, "languages": self.languages()}
