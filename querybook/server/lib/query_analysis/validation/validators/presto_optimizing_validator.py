import re
from itertools import chain
from sqlglot import TokenType, Tokenizer
from sqlglot.dialects import Trino
from sqlglot.tokens import Token
from typing import List

from lib.elasticsearch.search_table import get_column_name_suggestion
from lib.query_analysis.lineage import process_query
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationSeverity,
)
from lib.query_analysis.validation.validators.presto_explain_validator import (
    PrestoExplainValidator,
)
from lib.query_analysis.validation.validators.base_sqlglot_validator import (
    BaseSQLGlotValidator,
)
from logic.admin import get_query_engine_by_id


class BasePrestoSQLGlotDecorator(BaseSQLGlotValidator):
    def __init__(self, validator: BaseQueryValidator):
        self._validator = validator

    def languages(self):
        return ["presto", "trino"]

    @property
    def tokenizer(self) -> Tokenizer:
        return Trino.Tokenizer()

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = None,
        **kwargs,
    ):
        """Override this method to add suggestions to validation results"""
        return self._validator.validate(query, uid, engine_id, **kwargs)


class UnionAllValidator(BasePrestoSQLGlotDecorator):
    @property
    def message(self):
        return "Using UNION ALL instead of UNION will execute faster"

    @property
    def severity(self) -> str:
        return QueryValidationSeverity.WARNING

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = None,
        **kwargs,
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = self._tokenize_query(query)
        validation_results = self._validator.validate(
            query, uid, engine_id, raw_tokens=raw_tokens
        )
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

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = None,
        **kwargs,
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = self._tokenize_query(query)

        validation_results = self._validator.validate(
            query, uid, engine_id, raw_tokens=raw_tokens
        )
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

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[Token] = None,
        **kwargs,
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = self._tokenize_query(query)

        validation_results = self._validator.validate(
            query, uid, engine_id, raw_tokens=raw_tokens
        )

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


class ColumnNameSuggester(BasePrestoSQLGlotDecorator):
    @property
    def message(self):
        return ""  # Unused, message is not changed

    @property
    def severity(self):
        return QueryValidationSeverity.WARNING  # Unused, severity is not changed

    def _get_tables_in_query(self, query: str, engine_id: int) -> List[str]:
        engine = get_query_engine_by_id(engine_id)
        tables_per_statement, _ = process_query(query, language=engine.language)
        return list(chain.from_iterable(tables_per_statement))

    def _is_column_name_error(self, validation_result: QueryValidationResult) -> bool:
        return bool(
            re.search(r"Column .* cannot be resolved", validation_result.message)
        )

    def _get_column_name_from_position(
        self, tokens: List[Token], query: str, start_line: int, start_ch: int
    ) -> str:
        column_error_start_index = self._get_query_index_by_coordinate(
            query, start_line, start_ch
        )
        for token in tokens:
            if token.start == column_error_start_index:
                return token.text
        return None

    def _search_columns_for_suggestion(self, columns: List[str], suggestion: str):
        """Return the case-sensitive column name by searching the table's columns for the suggestion text"""
        for col in columns:
            if col.lower() == suggestion.lower():
                return col
        return suggestion

    def _get_column_name_suggestion(
        self,
        validation_result: QueryValidationResult,
        query: str,
        tables_in_query: List[str],
        raw_tokens: List[Token],
    ):
        fuzzy_column_name = self._get_column_name_from_position(
            raw_tokens, query, validation_result.start_line, validation_result.start_ch
        )
        if not fuzzy_column_name:
            return None
        results, count = get_column_name_suggestion(fuzzy_column_name, tables_in_query)
        if count == 1:  # Only return suggestion if there's a single match
            table_result = results[0]
            highlights = table_result.get("highlight", {}).get("columns", [])
            if len(highlights) == 1:
                column_suggestion = self._search_columns_for_suggestion(
                    table_result.get("columns"), highlights[0]
                )
                return column_suggestion

        return None

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        raw_tokens: List[QueryValidationResult] = None,
        **kwargs,
    ) -> List[QueryValidationResult]:
        if raw_tokens is None:
            raw_tokens = self._tokenize_query(query)
        validation_results = self._validator.validate(
            query, uid, engine_id, raw_tokens=raw_tokens
        )
        tables_in_query = self._get_tables_in_query(query, engine_id)
        for result in validation_results:
            # "Column .* cannot be resolved" -> to get all name errors
            if self._is_column_name_error(result):
                column_suggestion = self._get_column_name_suggestion(
                    result, query, tables_in_query, raw_tokens
                )
                if column_suggestion:
                    result.suggestion = column_suggestion
        return validation_results


class PrestoOptimizingValidator(BaseQueryValidator):
    def languages(self):
        return ["presto", "trino"]

    def _get_explain_validator(self):
        return PrestoExplainValidator("")

    def _get_decorated_validator(self) -> BaseQueryValidator:
        return UnionAllValidator(
            ApproxDistinctValidator(
                RegexpLikeValidator(ColumnNameSuggester(self._get_explain_validator()))
            )
        )

    def validate(
        self, query: str, uid: int, engine_id: int, **kwargs
    ) -> List[QueryValidationResult]:
        validator = self._get_decorated_validator()
        return validator.validate(query, uid, engine_id)
