from abc import ABCMeta, abstractmethod
from typing import List, Tuple
from sqlglot import TokenType
from sqlglot.dialects import Trino
from sqlglot.tokens import Token

from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)
from lib.query_analysis.validation.validators.presto_explain_validator import (
    PrestoExplainValidator,
)

UNION_ALL_SUGGESTION = "UNION ALL"
APPROX_DISTINCT_SUGGESTION = "APPROX_DISTINCT("

UNION_ALL_MESSAGE = "Using UNION ALL instead of UNION will execute faster"
REGEXP_LIKE_MESSAGE = (
    "Combining multiple LIKEs into one REGEXP_LIKE will execute faster"
)
APPROX_DISTINCT_MESSAGE = (
    "Using APPROX_DISTINCT(x) instead of COUNT(DISTINCT x) will execute faster"
)


def _get_query_coordinate_by_index(query: str, index: int) -> Tuple[int, int]:
    rows = query[: index + 1].splitlines(keepends=False)
    return len(rows) - 1, len(rows[-1]) - 1


def _tokenize_query(query: str) -> List[Token]:
    return Trino.Tokenizer().tokenize(query)


class BaseSQLGlotValidator(metaclass=ABCMeta):
    @property
    @abstractmethod
    def message(self) -> str:
        raise NotImplementedError()

    @property
    @abstractmethod
    def severity(self) -> QueryValidationSeverity:
        raise NotImplementedError()

    def _get_query_validation_result(
        self,
        query: str,
        start_index: int,
        end_index: int,
        suggestion: str = None,
        validation_result_object_type=QueryValidationResultObjectType.SUGGESTION,
    ):
        start_line, start_ch = _get_query_coordinate_by_index(query, start_index)
        end_line, end_ch = _get_query_coordinate_by_index(query, end_index)

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
    def get_query_validation_results(
        self, query: str, raw_tokens: List[Token] = None
    ) -> List[QueryValidationResult]:
        raise NotImplementedError()


class UnionAllValidator(BaseSQLGlotValidator):
    @property
    def message(self):
        return UNION_ALL_MESSAGE

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def get_query_validation_results(
        self, query: str, raw_tokens: List[Token] = None
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = _tokenize_query(query)
        validation_errors = []
        for i, token in enumerate(raw_tokens):
            if token.token_type == TokenType.UNION:
                if (
                    i < len(raw_tokens) - 1
                    and raw_tokens[i + 1].token_type != TokenType.ALL
                ):
                    validation_errors.append(
                        self._get_query_validation_result(
                            query, token.start, token.end, UNION_ALL_SUGGESTION
                        )
                    )
        return validation_errors


class ApproxDistinctValidator(BaseSQLGlotValidator):
    @property
    def message(self):
        return APPROX_DISTINCT_MESSAGE

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def get_query_validation_results(
        self, query: str, raw_tokens: List[Token] = None
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = _tokenize_query(query)

        validation_errors = []
        for i, token in enumerate(raw_tokens):
            if (
                i < len(raw_tokens) - 2
                and token.token_type == TokenType.VAR
                and token.text.lower().strip() == "count"
                and raw_tokens[i + 1].token_type == TokenType.L_PAREN
                and raw_tokens[i + 2].token_type == TokenType.DISTINCT
            ):
                validation_errors.append(
                    self._get_query_validation_result(
                        query,
                        token.start,
                        raw_tokens[i + 2].end,
                        APPROX_DISTINCT_SUGGESTION,
                    )
                )
        return validation_errors


class RegexpLikeValidator(BaseSQLGlotValidator):
    @property
    def message(self):
        return REGEXP_LIKE_MESSAGE

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def _get_regexp_like_suggestion(self, column_name: str, like_strings: List[str]):
        sanitized_like_strings = [
            like_string.strip("\"'") for like_string in like_strings
        ]
        return f"REGEXP_LIKE({column_name}, '{'|'.join(sanitized_like_strings)}')"

    def get_query_validation_results(
        self, query: str, raw_tokens: List[Token] = None
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = _tokenize_query(query)

        validation_errors = []

        start_column_token = None
        like_strings = []
        token_idx = 0
        while token_idx < len(raw_tokens) - 2:
            token_1 = raw_tokens[token_idx]
            token_2 = raw_tokens[token_idx + 1]
            token_3 = raw_tokens[token_idx + 2]

            # Check if the next set of three tokens matches a "like" phrase (i.e. <column> LIKE <string>)
            if (
                token_1.token_type == TokenType.VAR
                and (
                    start_column_token is None
                    or token_1.text == start_column_token.text
                )
                and token_2.token_type == TokenType.LIKE
                and token_3.token_type == TokenType.STRING
            ):
                if start_column_token is None:
                    start_column_token = raw_tokens[token_idx]
                like_strings.append(token_3.text)
                token_idx += 3
                if (
                    token_idx == len(raw_tokens)
                    or raw_tokens[token_idx].token_type != TokenType.OR
                ):  # No "OR" token following the phrase, so we cannot combine additional phrases
                    # Check if there are multiple phrases that can be combined
                    if len(like_strings) > 1:
                        validation_errors.append(
                            self._get_query_validation_result(
                                query,
                                start_column_token.start,
                                raw_tokens[token_idx - 1].end,
                                suggestion=self._get_regexp_like_suggestion(
                                    start_column_token.text, like_strings
                                ),
                            )
                        )
                    start_column_token = None
                    like_strings = []

            # If next tokens do not match the "like" phrase pattern, check if a suggestion can be made if there are previously matched phrases
            elif start_column_token is not None:
                if (
                    len(like_strings) > 1
                ):  # Check if a validation suggestion can be created
                    validation_errors.append(
                        self._get_query_validation_result(
                            query,
                            start_column_token.start,
                            raw_tokens[token_idx - 1].end,
                            suggestion=self._get_regexp_like_suggestion(
                                start_column_token.text, like_strings
                            ),
                        )
                    )
                start_column_token = None
                like_strings = []
            token_idx += 1

        return validation_errors


class PrestoOptimizingValidator(PrestoExplainValidator):
    def _get_sqlglot_validators(self) -> List[BaseSQLGlotValidator]:
        return [
            UnionAllValidator(),
            ApproxDistinctValidator(),
            RegexpLikeValidator(),
        ]

    def _get_validation_suggestions(self, query: str) -> List[QueryValidationResult]:
        validation_suggestions = []

        query_raw_tokens = _tokenize_query(query)
        for validator in self._get_sqlglot_validators():
            validation_suggestions.extend(
                validator.get_query_validation_results(
                    query, raw_tokens=query_raw_tokens
                )
            )

        return validation_suggestions

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
    ) -> List[QueryValidationResult]:
        presto_explain_validation_errors = super(
            PrestoOptimizingValidator, self
        ).validate(query, uid, engine_id)
        validation_results = (
            presto_explain_validation_errors + self._get_validation_suggestions(query)
        )
        return validation_results
