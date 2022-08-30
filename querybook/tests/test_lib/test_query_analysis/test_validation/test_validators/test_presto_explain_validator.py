from unittest import TestCase
from lib.query_analysis.validation.validators.presto_explain_validator import (
    PrestoExplainValidator,
)


class ConvertQueryToExplainsTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()

        self._validator = PrestoExplainValidator("")

    def test_simple(self):
        query = "select 1; select 2;\nselect 3"
        explains_query, start_locations = self._validator._convert_query_to_explains(
            query
        )

        self.assertListEqual(
            explains_query,
            [
                "EXPLAIN (TYPE VALIDATE)\nselect 1",
                "EXPLAIN (TYPE VALIDATE)\nselect 2",
                "EXPLAIN (TYPE VALIDATE)\nselect 3",
            ],
        )
        self.assertListEqual(start_locations, [(0, 0), (0, 10), (1, 0)])


class MapStatementErrorToQueryTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()

        self._validator = PrestoExplainValidator("")

    def test_simple(self):
        # query = "select 1; select 2;\nselect 3"
        statement_start_locations = [(0, 0), (0, 10), (1, 0)]

        validation_result = self._validator._map_statement_error_to_query(
            1, statement_start_locations, error_line=0, error_ch=2, error_msg=""
        )

        self.assertEqual(validation_result.line, 0)
        self.assertEqual(validation_result.ch, 12)

        validation_result = self._validator._map_statement_error_to_query(
            2, statement_start_locations, error_line=0, error_ch=5, error_msg=""
        )
        self.assertEqual(validation_result.line, 1)
        self.assertEqual(validation_result.ch, 5)
