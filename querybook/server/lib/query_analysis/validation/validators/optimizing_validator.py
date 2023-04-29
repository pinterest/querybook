from typing import List, Tuple
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
    QueryValidationSeverity,
)


class OptimizingValidator(BaseQueryValidator):
    def languages(self):
        return ["presto", "trino", "sqlite"]

    def validate(
        self,
        query: str,
        uid: int,  # who is doing the syntax check
        engine_id: int,  # which engine they are checking against
    ) -> List[QueryValidationResult]:
        validation_errors = []

        validation_errors = [
            QueryValidationResult(
                0,
                0,
                QueryValidationSeverity.ERROR,  # TODO: Should there be a new type in QueryValidationResultObjectType for optmization suggestions/diffs?
                "A WILD ERROR APPEARS!",
                diff="new query",
            )
        ]
        return validation_errors
