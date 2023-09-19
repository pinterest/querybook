from abc import abstractmethod
from typing import Any, Dict, List, Tuple
from sqlglot import Tokenizer
from sqlglot.tokens import Token

from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)
from lib.query_analysis.validation.base_query_validator import BaseQueryValidator


class BaseSQLGlotValidator(BaseQueryValidator):
    def __init__(self, name: str = "", config: Dict[str, Any] = {}):
        super(BaseSQLGlotValidator, self).__init__(name, config)

    @property
    @abstractmethod
    def message(self) -> str:
        raise NotImplementedError()

    @property
    @abstractmethod
    def severity(self) -> QueryValidationSeverity:
        raise NotImplementedError()

    @property
    @abstractmethod
    def tokenizer(self) -> Tokenizer:
        raise NotImplementedError()

    def _tokenize_query(self, query: str) -> List[Token]:
        return self.tokenizer.tokenize(query)

    def _get_query_coordinate_by_index(self, query: str, index: int) -> Tuple[int, int]:
        rows = query[: index + 1].splitlines(keepends=False)
        return len(rows) - 1, len(rows[-1]) - 1

    def _get_query_index_by_coordinate(
        self, query: str, start_line: int, start_ch: int
    ) -> int:
        rows = query.splitlines(keepends=True)[:start_line]
        return sum([len(row) for row in rows]) + start_ch

    def _get_query_validation_result(
        self,
        query: str,
        start_index: int,
        end_index: int,
        suggestion: str = None,
        validation_result_object_type=QueryValidationResultObjectType.LINT,
    ):
        start_line, start_ch = self._get_query_coordinate_by_index(query, start_index)
        end_line, end_ch = self._get_query_coordinate_by_index(query, end_index)

        return QueryValidationResult(
            start_line,
            start_ch,
            self.severity,
            self.message,
            validation_result_object_type,
            end_line=end_line,
            end_ch=end_ch,
            suggestion=suggestion,
        )

    @abstractmethod
    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = None,
        **kwargs
    ) -> List[QueryValidationResult]:
        raise NotImplementedError()
