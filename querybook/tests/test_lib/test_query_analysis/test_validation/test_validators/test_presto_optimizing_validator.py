from typing import List
from unittest import TestCase
from unittest.mock import patch, MagicMock

from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)
from lib.query_analysis.validation.validators.presto_optimizing_validator import (
    ApproxDistinctValidator,
    PrestoColumnNameSuggester,
    PrestoTableNameSuggester,
    RegexpLikeValidator,
    UnionAllValidator,
    PrestoOptimizingValidator,
)


class BaseValidatorTestCase(TestCase):
    def _get_explain_validator_mock(self):
        explain_validator_mock = MagicMock()
        explain_validator_mock.validate.return_value = []
        return explain_validator_mock

    def _verify_query_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        expected_results: List[QueryValidationResult],
    ):
        self.assertEqual(len(validation_results), len(expected_results))
        for i, validation_result in enumerate(validation_results):
            expected_result = expected_results[i]
            self.assertEqual(validation_result.to_dict(), expected_result.to_dict())

    def _get_regexp_like_validation_result(
        self,
        start_line: int,
        start_ch: int,
        end_line: int,
        end_ch: int,
        suggestion: str = None,
    ):
        return QueryValidationResult(
            start_line,
            start_ch,
            QueryValidationSeverity.WARNING,
            "Combining multiple LIKEs into one REGEXP_LIKE will execute faster",
            QueryValidationResultObjectType.LINT,
            end_line=end_line,
            end_ch=end_ch,
            suggestion=suggestion,
        )

    def _get_union_all_validation_result(
        self, start_line: int, start_ch: int, end_line: int, end_ch: int
    ):
        return QueryValidationResult(
            start_line,
            start_ch,
            QueryValidationSeverity.WARNING,
            "Using UNION ALL instead of UNION will execute faster",
            QueryValidationResultObjectType.LINT,
            end_line=end_line,
            end_ch=end_ch,
            suggestion="UNION ALL",
        )

    def _get_approx_distinct_validation_result(
        self, start_line: int, start_ch: int, end_line: int, end_ch: int
    ):
        return QueryValidationResult(
            start_line,
            start_ch,
            QueryValidationSeverity.WARNING,
            "Using APPROX_DISTINCT(x) instead of COUNT(DISTINCT x) will execute faster",
            QueryValidationResultObjectType.LINT,
            end_line=end_line,
            end_ch=end_ch,
            suggestion="APPROX_DISTINCT(",
        )


class UnionAllValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = UnionAllValidator(self._get_explain_validator_mock())

    def test_basic_union(self):
        query = "SELECT * FROM a \nUNION SELECT * FROM b"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_union_all_validation_result(
                    1,
                    0,
                    1,
                    4,
                )
            ],
        )

    def test_multiple_unions(self):
        query = "SELECT * FROM a \nUNION SELECT * FROM b \nUNION SELECT * FROM c"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_union_all_validation_result(
                    1,
                    0,
                    1,
                    4,
                ),
                self._get_union_all_validation_result(
                    2,
                    0,
                    2,
                    4,
                ),
            ],
        )

    def test_union_all(self):
        query = "SELECT * FROM a UNION ALL SELECT * FROM b"
        self._verify_query_validation_results(self._validator.validate(query, 0, 0), [])


class ApproxDistinctValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = ApproxDistinctValidator(self._get_explain_validator_mock())

    def test_basic_count_distinct(self):
        query = "SELECT COUNT(DISTINCT x) FROM a"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [self._get_approx_distinct_validation_result(0, 7, 0, 20)],
        )

    def test_count_not_followed_by_distinct(self):
        query = "SELECT \nCOUNT * FROM a"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [],
        )

    def test_multiple_count_distincts(self):
        query = (
            "SELECT \nCOUNT(DISTINCT y) FROM a UNION SELECT \nCOUNT(DISTINCT x) FROM b"
        )
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_approx_distinct_validation_result(1, 0, 1, 13),
                self._get_approx_distinct_validation_result(2, 0, 2, 13),
            ],
        )

    def test_count_distinct_in_where_clause(self):
        query = (
            "SELECT \nCOUNT(DISTINCT a), b FROM table_a WHERE \nCOUNT(DISTINCT a) > 10"
        )
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_approx_distinct_validation_result(1, 0, 1, 13),
                self._get_approx_distinct_validation_result(2, 0, 2, 13),
            ],
        )


class RegexpLikeValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = RegexpLikeValidator(self._get_explain_validator_mock())

    def test_basic_combine_case(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE \n'bar'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                )
            ],
        )

    def test_and_clause(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo%' AND x LIKE \n'%bar'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [],
        )

    def test_more_than_two_phrases(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE 'bar' OR x LIKE \n'baz'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar|baz')"
                )
            ],
        )

    def test_different_column_names(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR y LIKE 'bar'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [],
        )

    def test_both_or_and(self):
        query = (
            "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE \n'bar' AND y LIKE 'foo'"
        )
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                )
            ],
        )

    def test_multiple_suggestions(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE \n'bar' AND \ny LIKE 'foo' OR y LIKE \n'bar'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
                self._get_regexp_like_validation_result(
                    3, 0, 4, 4, "REGEXP_LIKE(y, 'foo|bar')"
                ),
            ],
        )

    def test_phrase_not_match(self):
        query = "SELECT * from a WHERE x LIKE 'foo' OR x = 'bar'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [],
        )


class PrestoColumnNameSuggesterTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = PrestoColumnNameSuggester(MagicMock())

    def test_get_column_name_from_error(self):
        self.assertEqual(
            self._validator.get_column_name_from_error(
                QueryValidationResult(
                    0,
                    0,
                    QueryValidationSeverity.WARNING,
                    "line 0:1: Column 'happyness' cannot be resolved",
                )
            ),
            "happyness",
        )
        self.assertEqual(
            self._validator.get_column_name_from_error(
                QueryValidationResult(
                    0,
                    0,
                    QueryValidationSeverity.WARNING,
                    "line 0:1: Table 'world_happiness_rank' does not exist",
                )
            ),
            None,
        )

    def test_search_columns_for_suggestion(self):
        self.assertEqual(
            self._validator._search_columns_for_suggestion(
                ["HappinessRank", "Country", "Region"], "country"
            ),
            "Country",
        )
        self.assertEqual(
            self._validator._search_columns_for_suggestion(
                ["HappinessRank, Region"], "country"
            ),
            "country",
        )

    def _get_new_validation_result_obj(self):
        return QueryValidationResult(
            0,
            7,
            QueryValidationSeverity.WARNING,
            "line 0:1: Column 'happynessrank' cannot be resolved",
        )

    @patch(
        "lib.elasticsearch.search_table.get_column_name_suggestion",
    )
    def test__get_column_name_suggestion(self, mock_get_column_name_suggestion):
        # Test too many tables matched
        validation_result = self._get_new_validation_result_obj()
        mock_get_column_name_suggestion.return_value = [
            [
                {
                    "columns": ["HappinessRank"],
                    "highlight": {"columns": ["happinessrank"]},
                },
                {
                    "columns": ["HappinessRank"],
                    "highlight": {"columns": ["happinessrank1"]},
                },
            ],
            2,
        ]
        self._validator._suggest_column_name_if_needed(
            validation_result,
            ["main.world_happiness_report"],
        )
        self.assertEqual(validation_result.suggestion, None)

        # Test too many columns in a table matched
        validation_result = self._get_new_validation_result_obj()
        mock_get_column_name_suggestion.return_value = [
            [
                {
                    "columns": ["HappinessRank", "HappinessRank1"],
                    "highlight": {"columns": ["happinessrank", "happinessrank1"]},
                },
            ],
            1,
        ]
        self._validator._suggest_column_name_if_needed(
            validation_result,
            ["main.world_happiness_report"],
        ),
        self.assertEqual(
            validation_result.suggestion,
            None,
        )

        # Test single column matched
        validation_result = self._get_new_validation_result_obj()
        mock_get_column_name_suggestion.return_value = [
            [
                {
                    "columns": ["HappinessRank", "HappinessRank1"],
                    "highlight": {"columns": ["happinessrank"]},
                },
            ],
            1,
        ]
        self._validator._suggest_column_name_if_needed(
            validation_result,
            ["main.world_happiness_report"],
        ),
        self.assertEqual(validation_result.suggestion, "HappinessRank")

        # Test no search results
        validation_result = self._get_new_validation_result_obj()
        mock_get_column_name_suggestion.return_value = [
            [],
            0,
        ]
        self._validator._suggest_column_name_if_needed(
            validation_result,
            ["main.world_happiness_report"],
        ),
        self.assertEqual(
            validation_result.suggestion,
            None,
        )


class PrestoTableNameSuggesterTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = PrestoTableNameSuggester(MagicMock())
        patch_get_metastore_id = patch(
            "logic.admin.get_query_metastore_id_by_engine_id"
        )
        mock_get_metastore_id = patch_get_metastore_id.start()
        mock_get_metastore_id.return_value = 1
        self.addCleanup(patch_get_metastore_id.stop)

    def test_get_full_table_name_from_error(self):
        self.assertEquals(
            self._validator.get_full_table_name_from_error(
                QueryValidationResult(
                    0,
                    0,
                    QueryValidationSeverity.WARNING,
                    "line 0:1: Table 'world_happiness_15' does not exist",
                )
            ),
            "world_happiness_15",
        )
        self.assertEquals(
            self._validator.get_full_table_name_from_error(
                QueryValidationResult(
                    0,
                    0,
                    QueryValidationSeverity.WARNING,
                    "line 0:1: column 'happiness_rank' cannot be resolved",
                )
            ),
            None,
        )

    @patch(
        "lib.elasticsearch.search_table.get_table_name_suggestion",
    )
    def test__suggest_table_name_if_needed_single_hit(self, mock_table_suggestion):
        validation_result = QueryValidationResult(
            0,
            0,
            QueryValidationSeverity.WARNING,
            "line 0:1: Table 'world_happiness_15' does not exist",
        )
        mock_table_suggestion.return_value = [
            {"schema": "main", "name": "world_happiness_rank_2015"}
        ], 1
        self._validator._suggest_table_name_if_needed(validation_result, 0)
        self.assertEquals(
            validation_result.suggestion, "main.world_happiness_rank_2015"
        )

    @patch(
        "lib.elasticsearch.search_table.get_table_name_suggestion",
    )
    def test__suggest_table_name_if_needed_multiple_hits(self, mock_table_suggestion):
        validation_result = QueryValidationResult(
            0,
            0,
            QueryValidationSeverity.WARNING,
            "line 0:1: Table 'world_happiness_15' does not exist",
        )
        mock_table_suggestion.return_value = [
            {"schema": "main", "name": "world_happiness_rank_2015"},
            {"schema": "main", "name": "world_happiness_rank_2016"},
        ], 2
        self._validator._suggest_table_name_if_needed(validation_result, 0)
        self.assertEquals(
            validation_result.suggestion, "main.world_happiness_rank_2015"
        )

    @patch(
        "lib.elasticsearch.search_table.get_table_name_suggestion",
    )
    def test__suggest_table_name_if_needed_no_hits(self, mock_table_suggestion):
        validation_result = QueryValidationResult(
            0,
            0,
            QueryValidationSeverity.WARNING,
            "line 0:1: Table 'world_happiness_15' does not exist",
        )
        mock_table_suggestion.return_value = [], 0
        self._validator._suggest_table_name_if_needed(validation_result, 0)
        self.assertEquals(validation_result.suggestion, None)


class PrestoOptimizingValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        super(PrestoOptimizingValidatorTestCase, self).setUp()
        patch_validator = patch.object(
            PrestoColumnNameSuggester,
            "validate",
            return_value=[],
        )
        patch_validator.start()
        self.addCleanup(patch_validator.stop)
        self._validator = PrestoOptimizingValidator("")

    def test_union_and_count_distinct(self):
        query = "SELECT \nCOUNT( DISTINCT x) from a \nUNION select \ncount(distinct y) from b"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_approx_distinct_validation_result(1, 0, 1, 14),
                self._get_approx_distinct_validation_result(3, 0, 3, 13),
                self._get_union_all_validation_result(2, 0, 2, 4),
            ],
        )

    def test_union_and_regexp_like(self):
        query = "SELECT * from a WHERE \nx like 'foo' or x like \n'bar' \nUNION select * from b where y like 'foo' AND x like 'bar'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
                self._get_union_all_validation_result(3, 0, 3, 4),
            ],
        )

    def test_count_distinct_and_regexp_like(self):
        query = "SELECT \nCOUNT( DISTINCT x) from a WHERE \nx LIKE 'foo' or x like \n'bar' and y like 'foo'"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    2, 0, 3, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
                self._get_approx_distinct_validation_result(1, 0, 1, 14),
            ],
        )

    def test_all_errors(self):
        query = "SELECT \nCOUNT( DISTINCT x) from a WHERE \nx LIKE 'foo' or x like \n'bar' and y like 'foo' \nUNION select * from b"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    2, 0, 3, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
                self._get_approx_distinct_validation_result(1, 0, 1, 14),
                self._get_union_all_validation_result(4, 0, 4, 4),
            ],
        )

    def test_extra_whitespace(self):
        query = "SELECT \n  COUNT( DISTINCT x) from a WHERE \n\t  x LIKE 'foo' or x like \n'bar' and y like 'foo' \n     UNION select * from b"
        self._verify_query_validation_results(
            self._validator.validate(query, 0, 0),
            [
                self._get_regexp_like_validation_result(
                    2, 3, 3, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
                self._get_approx_distinct_validation_result(1, 2, 1, 16),
                self._get_union_all_validation_result(4, 5, 4, 9),
            ],
        )
