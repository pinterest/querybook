from unittest import TestCase
from lib.query_analysis.validation.validators.optimizing_validator import (
    OptimizingValidator,
    SqlglotTransformer,
)
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)
from typing import List


class OpcodesToLinesTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_opcodes_to_lines_empty_string(self):
        result = SqlglotTransformer.opcodes_to_lines(
            opcodes=[("equal", 0, None, None, None)], original_string=""
        )
        self.assertEqual(result, [(0, 0)])

    def test_opcodes_to_lines_one_newline(self):
        self.assertEqual(
            SqlglotTransformer.opcodes_to_lines(
                opcodes=[("equal", 0, None, None, None)], original_string="1234\n5678"
            ),
            [(0, 0)],
        )
        self.assertEqual(
            SqlglotTransformer.opcodes_to_lines(
                opcodes=[("equal", 4, None, None, None)], original_string="1234\n5678"
            ),
            [(1, 0)],
        )

    def test_opcodes_to_lines_last_character(self):
        self.assertEqual(
            SqlglotTransformer.opcodes_to_lines(
                opcodes=[("equal", 7, None, None, None)], original_string="1234\n5678"
            ),
            [(1, 3)],
        )


class OptimizingValidatorTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._validator = OptimizingValidator(name="optimizing_validator")

    def test_unformatted_query(self):
        query = "SELECT \n\nCOUNT(DISTINCT x) FROM y"
        result = self._validator.validate(query=query, uid=0, engine_id=0)
        self.assertEqual(len(result), 0)

    def test_approx_distinct(self):
        query = "SELECT COUNT(DISTINCT x) FROM y"
        result = self._validator.validate(query=query, uid=0, engine_id=0)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].diff.b, "SELECT APPROX_DISTINCT(x) FROM y")

    def test_union_all(self):
        result = self._validator.validate(
            query="SELECT * FROM a UNION SELECT * FROM b", uid=0, engine_id=0
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].diff.b, "SELECT * FROM a UNION ALL SELECT * FROM b")

    def test_regexplike(self):
        result = self._validator.validate(
            query="SELECT * FROM a WHERE x LIKE 'y' OR x LIKE 'z'", uid=0, engine_id=0
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0].diff.b, "SELECT * FROM a WHERE REGEXP_LIKE(x, 'y|z')"
        )

    def test_approx_distinct_and_union_all(self):
        query = "SELECT COUNT(DISTINCT x) FROM y UNION SELECT z FROM a"
        result = self._validator.validate(query=query, uid=0, engine_id=0)
        self.assertEqual(len(result), 2)
        self.assertEqual(
            result[1].diff.b, "SELECT APPROX_DISTINCT(x) FROM y UNION SELECT z FROM a"
        )
        self.assertEqual(
            result[0].diff.b,
            "SELECT COUNT(DISTINCT x) FROM y UNION ALL SELECT z FROM a",
        )

    def test_union_all(self):
        result = self._validator.validate(
            query="SELECT * FROM a UNION SELECT * FROM b", uid=0, engine_id=0
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].diff.b, "SELECT * FROM a UNION ALL SELECT * FROM b")
