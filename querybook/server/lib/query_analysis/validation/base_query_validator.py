from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
from lib.query_analysis.templating import (
    QueryTemplatingError,
    render_templated_query,
)


class QueryValidationResultObjectType(Enum):
    LINT = "lint"
    GENERAL = "general"


class QueryValidationSeverity(Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


# TODO: This would be cleaner as a dataclass, but we'd have to make the argument and attribute names consistent
class QueryValidationResult(object):
    def __init__(
        self,
        line: int,  # 0 based
        ch: int,  # location of the starting token
        severity: QueryValidationSeverity,
        message: str,
        obj_type: QueryValidationResultObjectType = QueryValidationResultObjectType.LINT,
        diff: Optional[str] = None,
    ):
        self.type = obj_type
        self.line = line
        self.ch = ch
        self.severity = severity
        self.message = message
        self.diff = diff

    def to_dict(self):  # TODO: would be neater to use dataclasses.asdict
        return {
            "type": self.type.value,
            "line": self.line,
            "ch": self.ch,
            "severity": self.severity.value,
            "message": self.message,
            "diff": self.diff,
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

    def validate_with_templated_vars(
        self, query: str, uid: int, engine_id: int, templated_vars: Dict[str, Any]
    ):
        try:
            templated_query = render_templated_query(query, templated_vars, engine_id)
        except QueryTemplatingError as e:
            return [QueryValidationResult(0, 0, QueryValidationSeverity.ERROR, str(e))]

        return self.validate(templated_query, uid, engine_id)

    def to_dict(self):
        return {"name": self._name, "languages": self.languages()}
