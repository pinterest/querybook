from unittest import TestCase
from lib.query_analysis.validation.validators.multi_validator import (
    MultiValidator,
)
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationResultObjectType,
    QueryValidationSeverity,
)
from typing import List


class MultiValidatorTestCase(TestCase):
    def setUp(self) -> None:
        class TestValidator1(BaseQueryValidator):
            def languages(self):
                return ["a", "b"]

            def validate(
                self,
                query: str,
                uid: int,  # who is doing the syntax check
                engine_id: int,  # which engine they are checking against
            ) -> List[QueryValidationResult]:
                return [
                    QueryValidationResult(
                        line=0,
                        ch=0,
                        severity=QueryValidationSeverity.WARNING,
                        message="message 1",
                        obj_type=QueryValidationResultObjectType.LINT,
                        diff=None,
                    )
                ]

        class TestValidator2(BaseQueryValidator):
            def languages(self):
                return ["b", "c"]

            def validate(
                self,
                query: str,
                uid: int,  # who is doing the syntax check
                engine_id: int,  # which engine they are checking against
            ) -> List[QueryValidationResult]:
                return [
                    QueryValidationResult(
                        line=0,
                        ch=0,
                        severity=QueryValidationSeverity.WARNING,
                        message="message 2",
                        obj_type=QueryValidationResultObjectType.LINT,
                        diff=None,
                    )
                ]

        super().setUp()

        self._validator1 = TestValidator1(name="test_validator_1")
        self._validator2 = TestValidator2(name="test_validator_2")

        self._multivalidator = MultiValidator(
            validators=[self._validator1, self._validator2]
        )

    def test_name(self):
        self.assertEqual(
            self._multivalidator._name, "test_validator_1+test_validator_2"
        )

    def test_languages(self):
        self.assertEqual(self._multivalidator.languages(), ["b"])

    def test_languages(self):
        self.assertEqual(
            [
                r.message
                for r in self._multivalidator.validate(
                    query="test",
                    uid=0,
                    engine_id=0,
                )
            ],
            ["message 1", "message 2"],
        )
