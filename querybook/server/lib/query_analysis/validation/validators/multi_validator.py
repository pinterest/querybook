from typing import List, Dict, Any
from lib.query_analysis.validation.base_query_validator import (
    BaseQueryValidator,
    QueryValidationResult,
)
import functools


class MultiValidator(BaseQueryValidator):
    """
    Used to combine the results from multiple validators
    """

    def __init__(
        self,
        validators: List[BaseQueryValidator],
        config: Dict[str, Any] = {},
    ) -> None:
        super().__init__(name="+".join(v._name for v in validators), config=config)
        self.validators = validators

    def languages(self):
        #  Only languages supported by all validators are supported
        return functools.reduce(
            lambda x, y: list(set(x).intersection(set(y))),
            (x.languages for x in self.validators),
        )

    def validate(
        self,
        query: str,
        uid: int,  # who is doing the syntax check
        engine_id: int,  # which engine they are checking against
    ) -> List[QueryValidationResult]:
        return [
            r
            for v in self.validators
            for r in v.validate(query=query, uid=uid, engine_id=engine_id)
        ]
