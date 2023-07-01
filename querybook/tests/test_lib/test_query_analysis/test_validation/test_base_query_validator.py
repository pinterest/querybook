from unittest import TestCase
from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
    DiffOpcode,
    QueryDiff,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)


class TestQueryValidationResultStringification(TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_complete(self):
        r = QueryValidationResult(
            line=0,
            ch=0,
            severity=QueryValidationSeverity.INFO,
            message="message",
            obj_type=QueryValidationResultObjectType.OPTIMIZATION,
            diff=QueryDiff(
                a="a",
                b="b",
                opcodes=[
                    DiffOpcode(tag="replace", a_start=0, a_end=0, b_start=0, b_end=0)
                ],
            ),
        )
        self.assertEqual(
            r.to_dict(),
            {
                "line": 0,
                "ch": 0,
                "severity": "info",
                "message": "message",
                "type": "optimization",
                "diff": {
                    "a": "a",
                    "b": "b",
                    "opcodes": [
                        {
                            "tag": "replace",
                            "a_start": 0,
                            "a_end": 0,
                            "b_start": 0,
                            "b_end": 0,
                        }
                    ],
                },
            },
        )

    def test_diff_and_optimization_type_together(self):
        self.assertRaises(
            AssertionError,
            lambda: QueryValidationResult(
                obj_type=QueryValidationResultObjectType.OPTIMIZATION,
                diff=None,
                line=0,
                ch=0,
                severity=QueryValidationSeverity.INFO,
                message="",
            ),
        )

        self.assertRaises(
            AssertionError,
            lambda: QueryValidationResult(
                obj_type=QueryValidationResultObjectType.LINT,
                diff=QueryDiff(
                    a="",
                    b="",
                    opcodes=[
                        DiffOpcode(
                            tag="replace", a_start=0, a_end=0, b_start=0, b_end=0
                        )
                    ],
                ),
                line=0,
                ch=0,
                severity=QueryValidationSeverity.INFO,
                message="",
            ),
        )
