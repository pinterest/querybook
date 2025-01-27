from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List
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


class QueryValidationResult(object):
    def __init__(
        self,
        start_line: int,  # 0 based
        start_ch: int,  # location of the starting token
        severity: QueryValidationSeverity,
        message: str,
        obj_type: QueryValidationResultObjectType = QueryValidationResultObjectType.LINT,
        end_line: int = None,  # 0 based
        end_ch: int = None,  # location of the ending token
        suggestion: str = None,
    ):
        self.type = obj_type
        self.start_line = start_line
        self.start_ch = start_ch
        self.end_line = end_line
        self.end_ch = end_ch
        self.severity = severity
        self.message = message
        self.suggestion = suggestion

    def to_dict(self):
        return {
            "type": self.type.value,
            "start_line": self.start_line,
            "start_ch": self.start_ch,
            "end_line": self.end_line,
            "end_ch": self.end_ch,
            "severity": self.severity.value,
            "message": self.message,
            "suggestion": self.suggestion,
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
        **kwargs,
    ) -> List[QueryValidationResult]:
        raise NotImplementedError()

    def validate_with_templated_vars(
        self, query: str, uid: int, engine_id: int, templated_vars: Dict[str, Any]
    ):
        try:
            templated_query = render_templated_query(
                query, templated_vars, engine_id, uid
            )
        except QueryTemplatingError as e:
            return [QueryValidationResult(0, 0, QueryValidationSeverity.ERROR, str(e))]

        return self.validate(templated_query, uid, engine_id)

    def to_dict(self):
        return {"name": self._name, "languages": self.languages()}
