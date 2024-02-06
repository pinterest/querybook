from abc import abstractmethod
from itertools import chain
from typing import List, Optional

from lib.elasticsearch import search_table
from lib.query_analysis.lineage import process_query
from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
)
from lib.query_analysis.validation.decorators.base_sqlglot_validation_decorator import (
    BaseValidationDecorator,
)
from logic import admin as admin_logic


class BaseColumnNameSuggester(BaseValidationDecorator):
    @abstractmethod
    def get_column_name_from_error(
        self, validation_result: QueryValidationResult
    ) -> Optional[str]:
        """Returns invalid column name if the validation result is a column name error, otherwise
        returns None"""
        raise NotImplementedError()

    def _get_tables_in_query(self, query: str, engine_id: int) -> List[str]:
        engine = admin_logic.get_query_engine_by_id(engine_id)
        tables_per_statement, _ = process_query(query, language=engine.language)
        return list(chain.from_iterable(tables_per_statement))

    def _search_columns_for_suggestion(self, columns: List[str], suggestion: str):
        """Return the case-sensitive column name by searching the table's columns for the suggestion text"""
        for col in columns:
            if col.lower() == suggestion.lower():
                return col
        return suggestion

    def _suggest_column_name_if_needed(
        self,
        validation_result: QueryValidationResult,
        tables_in_query: List[str],
    ):
        """Takes validation result and tables in query to update validation result to provide column
        name suggestion"""
        fuzzy_column_name = self.get_column_name_from_error(validation_result)
        if not fuzzy_column_name:
            return
        results, count = search_table.get_column_name_suggestion(
            fuzzy_column_name, tables_in_query
        )
        if count == 1:  # Only suggest column if there's a single match
            table_result = results[0]
            highlights = table_result.get("highlight", {}).get("columns", [])
            if len(highlights) == 1:
                column_suggestion = self._search_columns_for_suggestion(
                    table_result.get("columns"), highlights[0]
                )
                validation_result.suggestion = column_suggestion
                validation_result.end_line = validation_result.start_line
                validation_result.end_ch = (
                    validation_result.start_ch + len(fuzzy_column_name) - 1
                )

    def decorate_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        query: str,
        uid: int,
        engine_id: int,
        **kwargs,
    ) -> List[QueryValidationResult]:
        tables_in_query = self._get_tables_in_query(query, engine_id)
        for result in validation_results:
            self._suggest_column_name_if_needed(result, tables_in_query)
        return validation_results


class BaseTableNameSuggester(BaseValidationDecorator):
    @abstractmethod
    def get_full_table_name_from_error(self, validation_result: QueryValidationResult):
        """Returns invalid table name if the validation result is a table name error, otherwise
        returns None"""
        raise NotImplementedError()

    def _suggest_table_name_if_needed(
        self,
        validation_result: QueryValidationResult,
        engine_id: int,
    ) -> Optional[str]:
        """Takes validation result and tables in query to update validation result to provide table
        name suggestion"""
        fuzzy_table_name = self.get_full_table_name_from_error(validation_result)
        if not fuzzy_table_name:
            return
        metastore_id = admin_logic.get_query_metastore_id_by_engine_id(engine_id)
        if metastore_id is None:
            return
        results, count = search_table.get_table_name_suggestion(
            fuzzy_table_name, metastore_id
        )
        if count > 0:
            table_result = results[0]  # Get top match
            table_suggestion = f"{table_result['schema']}.{table_result['name']}"
            validation_result.suggestion = table_suggestion
            validation_result.end_line = validation_result.start_line
            validation_result.end_ch = (
                validation_result.start_ch + len(fuzzy_table_name) - 1
            )

    def decorate_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        query: str,
        uid: int,
        engine_id: int,
        **kwargs,
    ) -> List[QueryValidationResult]:
        for result in validation_results:
            self._suggest_table_name_if_needed(result, engine_id)
        return validation_results
