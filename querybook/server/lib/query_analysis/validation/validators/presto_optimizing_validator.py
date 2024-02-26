import re
from sqlglot import TokenType, Tokenizer
from sqlglot.dialects import Trino
from sqlglot.tokens import Token
from typing import List

from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationSeverity,
)
from lib.query_analysis.validation.validators.presto_explain_validator import (
    PrestoExplainValidator,
)
from lib.query_analysis.validation.decorators.base_sqlglot_validation_decorator import (
    BaseSQLGlotValidationDecorator,
)
from lib.query_analysis.validation.decorators.metadata_decorators import (
    BaseColumnNameSuggester,
    BaseTableNameSuggester,
)


class BasePrestoSQLGlotDecorator(BaseSQLGlotValidationDecorator):
    @property
    def tokenizer(self) -> Tokenizer:
        return Trino.Tokenizer()


class UnionAllValidator(BasePrestoSQLGlotDecorator):
    @property
    def message(self):
        return "Using UNION ALL instead of UNION will execute faster"

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def decorate_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = [],
        **kwargs,
    ) -> List[QueryValidationResult]:
        for i, token in enumerate(raw_tokens):
            if token.token_type == TokenType.UNION:
                if (
                    i < len(raw_tokens) - 1
                    and raw_tokens[i + 1].token_type != TokenType.ALL
                ):
                    validation_results.append(
                        self._get_query_validation_result(
                            query, token.start, token.end, "UNION ALL"
                        )
                    )
        return validation_results


class ApproxDistinctValidator(BasePrestoSQLGlotDecorator):
    @property
    def message(self):
        return (
            "Using APPROX_DISTINCT(x) instead of COUNT(DISTINCT x) will execute faster"
        )

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def decorate_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = [],
        **kwargs,
    ) -> List[QueryValidationResult]:
        for i, token in enumerate(raw_tokens):
            if (
                i < len(raw_tokens) - 2
                and token.token_type == TokenType.VAR
                and token.text.lower().strip() == "count"
                and raw_tokens[i + 1].token_type == TokenType.L_PAREN
                and raw_tokens[i + 2].token_type == TokenType.DISTINCT
            ):
                validation_results.append(
                    self._get_query_validation_result(
                        query,
                        token.start,
                        raw_tokens[i + 2].end,
                        "APPROX_DISTINCT(",
                    )
                )
        return validation_results


class RegexpLikeValidator(BasePrestoSQLGlotDecorator):
    @property
    def message(self):
        return "Combining multiple LIKEs into one REGEXP_LIKE will execute faster"

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def _get_regexp_like_suggestion(self, column_name: str, like_strings: List[str]):
        sanitized_like_strings = [
            like_string.strip("\"'") for like_string in like_strings
        ]
        return f"REGEXP_LIKE({column_name}, '{'|'.join(sanitized_like_strings)}')"

    def decorate_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = [],
        **kwargs,
    ) -> List[QueryValidationResult]:
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
                        validation_results.append(
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
                    validation_results.append(
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

        return validation_results


class PrestoColumnNameSuggester(BaseColumnNameSuggester):
    def get_column_name_from_error(self, validation_result: QueryValidationResult):
        regex_result = re.match(
            r"line \d+:\d+: Column '(.*)' cannot be resolved", validation_result.message
        )
        return regex_result.groups()[0] if regex_result else None


class PrestoTableNameSuggester(BaseTableNameSuggester):
    def get_full_table_name_from_error(self, validation_result: QueryValidationResult):
        regex_result = re.match(
            r"line \d+:\d+: Table '(.*)' does not exist", validation_result.message
        )
        return regex_result.groups()[0] if regex_result else None


class PrestoOptimizingValidator(BaseQueryValidator):
    def languages(self):
        return ["presto", "trino"]

    def _get_explain_validator(self):
        return PrestoExplainValidator("")

    def _get_decorated_validator(self) -> BaseQueryValidator:
        return UnionAllValidator(
            ApproxDistinctValidator(
                RegexpLikeValidator(
                    PrestoTableNameSuggester(
                        PrestoColumnNameSuggester(self._get_explain_validator())
                    )
                )
            )
        )

    def validate(
        self, query: str, uid: int, engine_id: int, **kwargs
    ) -> List[QueryValidationResult]:
        validator = self._get_decorated_validator()
        return validator.validate(query, uid, engine_id)
