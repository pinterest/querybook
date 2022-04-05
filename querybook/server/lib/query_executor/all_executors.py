from typing import Dict
from lib.utils.import_helper import (
    import_module_with_default,
    import_modules,
)
from .base_executor import parse_exception
from lib.logger import get_logger

from .executors.sqlalchemy import GenericSqlAlchemyQueryExecutor

LOG = get_logger(__file__)

PROVIDED_EXECUTORS = import_modules(
    [
        ("lib.query_executor.executors.hive", "HiveQueryExecutor"),
        ("lib.query_executor.executors.presto", "PrestoQueryExecutor"),
        ("lib.query_executor.executors.bigquery", "BigQueryQueryExecutor"),
        ("lib.query_executor.executors.snowflake", "SnowflakeQueryExecutor"),
        ("lib.query_executor.executors.trino", "TrinoQueryExecutor"),
        ("lib.query_executor.executors.redshift", "RedshiftQueryExecutor"),
    ]
)
ALL_PLUGIN_EXECUTORS = import_module_with_default(
    "executor_plugin", "ALL_PLUGIN_EXECUTORS", default=[]
)
ALL_EXECUTORS = (
    [GenericSqlAlchemyQueryExecutor] + PROVIDED_EXECUTORS + ALL_PLUGIN_EXECUTORS
)


def get_executor_class(language: str, name: str):
    for executor in ALL_EXECUTORS:
        if executor.match(language, name):
            return executor
    raise ValueError(f"Unknown executor {name} with language {language}")


def get_flattened_executor_template() -> Dict:
    """A query executor may correspond to multiple languages, in this case we duplicate
       the number of available executor template per language per executor.

    Returns:
        Dict: a Dictionary with 3 keys
          language -> str
          name -> str
          template -> JSON object
    """

    all_templates = []
    for executor_cls in ALL_EXECUTORS:
        executor_language = executor_cls.EXECUTOR_LANGUAGE()
        executor_name = executor_cls.EXECUTOR_NAME()
        executor_template = executor_cls.EXECUTOR_TEMPLATE()

        executor_languages = (
            [executor_language]
            if isinstance(executor_language, str)
            else executor_language
        )

        for language in executor_languages:
            all_templates.append(
                dict(
                    language=language,
                    name=executor_name,
                    template=executor_template,
                )
            )
    return all_templates


# Re-export parse_exception
parse_exception
