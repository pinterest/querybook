from lib.utils.import_helper import import_module_with_default, import_modules
from .base_query_validator import BaseQueryValidator

ALL_DEFAULT_QUERY_VALIDATORS = import_modules(
    [
        (
            "lib.query_analysis.validation.validators.presto_explain_validator",
            "PrestoExplainValidator",
        ),
    ]
)

ALL_PLUGIN_QUERY_VALIDATORS_BY_NAME = import_module_with_default(
    "query_validation_plugin", "ALL_PLUGIN_QUERY_VALIDATORS_BY_NAME", default={}
)

ALL_QUERY_VALIDATORS_BY_NAME = {
    validator_cls.__name__: validator_cls(validator_cls.__name__)
    for validator_cls in ALL_DEFAULT_QUERY_VALIDATORS
} | ALL_PLUGIN_QUERY_VALIDATORS_BY_NAME


def get_validator_by_name(name: str) -> BaseQueryValidator:
    return ALL_QUERY_VALIDATORS_BY_NAME[name]
