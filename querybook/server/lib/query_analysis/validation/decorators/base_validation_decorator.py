from abc import ABCMeta, abstractmethod
from typing import List

from lib.query_analysis.validation.base_query_validator import (
    QueryValidationResult,
)
from lib.query_analysis.validation.base_query_validator import BaseQueryValidator


class BaseValidationDecorator(metaclass=ABCMeta):
    def __init__(self, validator: BaseQueryValidator):
        self._validator = validator

    @abstractmethod
    def decorate_validation_results(
        self,
        validation_results: List[QueryValidationResult],
        query: str,
        uid: int,
        engine_id: int,
        **kwargs,
    ) -> List[QueryValidationResult]:
        raise NotImplementedError()

    def validate(
        self,
        query: str,
        uid: int,
        engine_id: int,
        **kwargs,
    ) -> List[QueryValidationResult]:
        validation_results = self._validator.validate(query, uid, engine_id, **kwargs)
        return self.decorate_validation_results(
            validation_results, query, uid, engine_id, **kwargs
        )
