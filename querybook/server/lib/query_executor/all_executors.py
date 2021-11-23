from typing import Dict
from lib.utils.plugin import import_plugin
from .base_executor import parse_exception

from .executors.hive import HiveQueryExecutor
from .executors.presto import PrestoQueryExecutor
from .executors.sqlalchemy import SnowflakeQueryExecutor, GenericSqlAlchemyQueryExecutor
from .executors.bigquery import BigQueryQueryExecutor
from .executors.trino import TrinoQueryExecutor
from .executors.salesforce_cdp import SalesforceCdpExecutor

ALL_PLUGIN_EXECUTORS = import_plugin("executor_plugin", "ALL_PLUGIN_EXECUTORS", [])


ALL_EXECUTORS = [
    HiveQueryExecutor,
    PrestoQueryExecutor,
    BigQueryQueryExecutor,
    GenericSqlAlchemyQueryExecutor,
    SnowflakeQueryExecutor,
    TrinoQueryExecutor,
    SalesforceCdpExecutor,
] + ALL_PLUGIN_EXECUTORS


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
                dict(language=language, name=executor_name, template=executor_template,)
            )
    return all_templates


# Re-export parse_exception
parse_exception
