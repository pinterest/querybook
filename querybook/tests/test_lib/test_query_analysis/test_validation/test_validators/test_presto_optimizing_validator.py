from typing import List
from unittest import TestCase

from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)
from lib.query_analysis.validation.validators.presto_optimizing_validator import (
    ApproxDistinctValidator,
    RegexpLikeValidator,
    UnionAllValidator,
    PrestoOptimizingValidator,
)


class BaseValidatorTestCase(TestCase):
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
            QueryValidationResultObjectType.SUGGESTION,
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
            QueryValidationResultObjectType.SUGGESTION,
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
            QueryValidationResultObjectType.SUGGESTION,
            end_line=end_line,
            end_ch=end_ch,
            suggestion="APPROX_DISTINCT(",
        )


class UnionAllValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = UnionAllValidator()

    def test_basic_union(self):
        query = "SELECT * FROM a \nUNION SELECT * FROM b"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
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
            self._validator.get_query_validation_results(query),
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
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query), []
        )


class ApproxDistinctValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = ApproxDistinctValidator()

    def test_basic_count_distinct(self):
        query = "SELECT COUNT(DISTINCT x) FROM a"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [self._get_approx_distinct_validation_result(0, 7, 0, 20)],
        )

    def test_count_not_followed_by_distinct(self):
        query = "SELECT \nCOUNT * FROM a"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [],
        )

    def test_multiple_count_distincts(self):
        query = (
            "SELECT \nCOUNT(DISTINCT y) FROM a UNION SELECT \nCOUNT(DISTINCT x) FROM b"
        )
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
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
            self._validator.get_query_validation_results(query),
            [
                self._get_approx_distinct_validation_result(1, 0, 1, 13),
                self._get_approx_distinct_validation_result(2, 0, 2, 13),
            ],
        )


class RegexpLikeValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = RegexpLikeValidator()

    def test_basic_combine_case(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE \n'bar'"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                )
            ],
        )

    def test_and_clause(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo%' AND x LIKE \n'%bar'"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [],
        )

    def test_more_than_two_phrases(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE 'bar' OR x LIKE \n'baz'"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar|baz')"
                )
            ],
        )

    def test_different_column_names(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR y LIKE 'bar'"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [],
        )

    def test_both_or_and(self):
        query = (
            "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE \n'bar' AND y LIKE 'foo'"
        )
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
            [
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                )
            ],
        )

    def test_multiple_suggestions(self):
        query = "SELECT * from a WHERE \nx LIKE 'foo' OR x LIKE \n'bar' AND \ny LIKE 'foo' OR y LIKE \n'bar'"
        self._verify_query_validation_results(
            self._validator.get_query_validation_results(query),
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
            self._validator.get_query_validation_results(query),
            [],
        )


class PrestoOptimizingValidatorTestCase(BaseValidatorTestCase):
    def setUp(self):
        self._validator = PrestoOptimizingValidator("")

    def test_union_and_count_distinct(self):
        query = "SELECT \nCOUNT( DISTINCT x) from a \nUNION select \ncount(distinct y) from b"
        self._verify_query_validation_results(
            self._validator._get_validation_suggestions(query),
            [
                self._get_union_all_validation_result(2, 0, 2, 4),
                self._get_approx_distinct_validation_result(1, 0, 1, 14),
                self._get_approx_distinct_validation_result(3, 0, 3, 13),
            ],
        )

    def test_union_and_regexp_like(self):
        query = "SELECT * from a WHERE \nx like 'foo' or x like \n'bar' \nUNION select * from b where y like 'foo' AND x like 'bar'"
        self._verify_query_validation_results(
            self._validator._get_validation_suggestions(query),
            [
                self._get_union_all_validation_result(3, 0, 3, 4),
                self._get_regexp_like_validation_result(
                    1, 0, 2, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
            ],
        )

    def test_count_distinct_and_regexp_like(self):
        query = "SELECT \nCOUNT( DISTINCT x) from a WHERE \nx LIKE 'foo' or x like \n'bar' and y like 'foo'"
        self._verify_query_validation_results(
            self._validator._get_validation_suggestions(query),
            [
                self._get_approx_distinct_validation_result(1, 0, 1, 14),
                self._get_regexp_like_validation_result(
                    2, 0, 3, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
            ],
        )

    def test_all_errors(self):
        query = "SELECT \nCOUNT( DISTINCT x) from a WHERE \nx LIKE 'foo' or x like \n'bar' and y like 'foo' \nUNION select * from b"
        self._verify_query_validation_results(
            self._validator._get_validation_suggestions(query),
            [
                self._get_union_all_validation_result(4, 0, 4, 4),
                self._get_approx_distinct_validation_result(1, 0, 1, 14),
                self._get_regexp_like_validation_result(
                    2, 0, 3, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
            ],
        )

    def test_extra_whitespace(self):
        query = "SELECT \n  COUNT( DISTINCT x) from a WHERE \n\t  x LIKE 'foo' or x like \n'bar' and y like 'foo' \n     UNION select * from b"
        self._verify_query_validation_results(
            self._validator._get_validation_suggestions(query),
            [
                self._get_union_all_validation_result(4, 5, 4, 9),
                self._get_approx_distinct_validation_result(1, 2, 1, 16),
                self._get_regexp_like_validation_result(
                    2, 3, 3, 4, "REGEXP_LIKE(x, 'foo|bar')"
                ),
            ],
        )
