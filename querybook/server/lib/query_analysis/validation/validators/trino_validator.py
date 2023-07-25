from abc import ABCMeta, abstractmethod
from typing import List
from sqlglot import TokenType
from sqlglot.dialects import Trino
from sqlglot.tokens import Token

from querybook.server.lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)


class BaseSQLGlotValidator(metaclass=ABCMeta):
    def __init__(
        self,
        query: str,
        raw_tokens: List[Token] = None,
    ):
        self._query = query
        self._raw_tokens = raw_tokens
        # TODO: add severity and message
        if self._raw_tokens is None:
            self._raw_tokens = Trino.Tokenizer().tokenize(query)
        if self._expression_tree is None:
            pass

    @property
    @abstractmethod
    def message(self) -> str:
        raise NotImplementedError()

    @property
    @abstractmethod
    def severity(self) -> QueryValidationSeverity:
        raise NotImplementedError()

    def _get_query_coordinate_by_index(self, index):
        rows = self._query[: index + 1].splitlines(keepends=False)
        return len(rows) - 1, len(rows[-1]) - 1

    def _get_query_validation_result(
        self,
        start_index: int,
        end_index: int,
        suggestion: str = None,
        validation_result_object_type=QueryValidationResultObjectType.SUGGESTION,
    ):
        start_line, start_ch = self._get_query_coordinate_by_index(start_index)
        end_line, end_ch = self._get_query_coordinate_by_index(end_index)

        return QueryValidationResult(
            start_line,
            start_ch,
            end_line,
            end_ch,
            self.severity,
            self.message,
            validation_result_object_type,
        )

    def get_query_validation_results(self) -> List[QueryValidationResult]:
        raise NotImplementedError()


class UnionAllValidator(BaseSQLGlotValidator):
    @property
    def message(self):
        return "Using UNION ALL instead of UNION will execute faster"

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def get_query_validation_results(self) -> List[QueryValidationResult]:
        validation_errors = []
        for i, token in enumerate(self._raw_tokens):
            if token.token_type == TokenType.UNION:
                if (
                    i < len(self._raw_tokens) - 1
                    and self._raw_tokens[i + 1] != TokenType.ALL
                ):
                    validation_errors.append(
                        self._get_query_validation_result(
                            token.start, token.end, "UNION_ALL"
                        )
                    )
        return validation_errors


class CountDistinctValidator(BaseSQLGlotValidator):
    @property
    def message(self):
        return (
            "Using APPROX_DISTINCT(x) instead of COUNT(DISTINCT x) will execute faster"
        )

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def get_query_validation_results(self) -> List[QueryValidationResult]:
        validation_errors = []
        for i, token in enumerate(self._raw_tokens):
            if (
                token.token_type == TokenType.VAR
                and token.text.lower().strip() == "count"
            ):
                if (
                    i < len(self._raw_tokens) - 2
                    and self._raw_tokens[i + 1].token_type == TokenType.L_PAREN
                    and self._raw_tokens[i + 2].token_type == TokenType.DISTINCT
                ):
                    validation_errors.append(
                        self._get_query_validation_result(
                            token.start, self._raw_tokens[i + 2].end, "APPROX_DISTINCT("
                        )
                    )
        return validation_errors


# TODO: Implement REGEXP_LIKE validation
