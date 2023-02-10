from typing import List, Tuple
from pyhive.exc import Error as PyHiveError
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationSeverity,
)
from lib.utils.execute_query import ExecuteQuery
from lib.query_executor.executors.presto import get_presto_error_dict
from lib.query_analysis.statements import split_query_to_statements_with_start_location


class PrestoExplainValidator(BaseQueryValidator):
    def _convert_query_to_explains(self, query: str):
        (
            statements,
            statement_start_locations,
        ) = split_query_to_statements_with_start_location(query)
        validation_statements = [
            f"EXPLAIN (TYPE VALIDATE)\n{statement}" for statement in statements
        ]

        return validation_statements, statement_start_locations

    def _get_semantic_error_from_exc(self, exc: PyHiveError):
        error_dict = get_presto_error_dict(exc)
        if error_dict:
            error_msg = error_dict.get("message", None)
            if "errorLocation" in error_dict:
                # Deduct 1 because Presto's error line/ch count starts at 1, but ours start at 0
                error_line = error_dict["errorLocation"].get("lineNumber", 1) - 1
                error_ch = error_dict["errorLocation"].get("columnNumber", 1) - 1

                # Deduct another 1 because the first line is used by EXPLAIN (TYPE VALIDATE)
                error_line -= 1

                return error_line, error_ch, error_msg
        return None

    def _map_statement_error_to_query(
        self,
        statement_idx: int,
        statement_start_locations: List[Tuple[int, int]],
        error_line: int,
        error_ch: int,
        error_msg: str,
    ):
        (
            statement_start_line,
            statement_start_ch,
        ) = statement_start_locations[statement_idx]
        statement_error_line = error_line + statement_start_line
        statement_error_ch = (
            error_ch + statement_start_ch if error_line == 0 else error_ch
        )

        return QueryValidationResult(
            statement_error_line,
            statement_error_ch,
            QueryValidationSeverity.ERROR,
            error_msg,
        )

    def _run_validation_statement(self, statement: str, engine_id: int, uid: int):
        ExecuteQuery(False, 0.1)(statement, engine_id, uid)

    def languages(self):
        return ["presto", "trino"]

    def validate(
        self,
        query: str,
        uid: int,  # who is doing the syntax check
        engine_id: int,  # which engine they are checking against
    ) -> List[QueryValidationResult]:
        validation_errors = []
        (
            validation_statements,
            statement_start_locations,
        ) = self._convert_query_to_explains(query)

        statement_idx = 0
        while statement_idx < len(validation_statements):
            try:
                self._run_validation_statement(
                    validation_statements[statement_idx], engine_id, uid
                )
            except PyHiveError as exc:
                presto_syntax_error = self._get_semantic_error_from_exc(exc)
                if presto_syntax_error:
                    error_line, error_ch, error_msg = presto_syntax_error
                    validation_errors.append(
                        self._map_statement_error_to_query(
                            statement_idx,
                            statement_start_locations,
                            error_line,
                            error_ch,
                            error_msg,
                        )
                    )

            statement_idx += 1
        return validation_errors
