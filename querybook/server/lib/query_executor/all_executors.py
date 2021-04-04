from lib.utils.plugin import import_plugin
from .base_executor import parse_exception

from .executors.hive import HiveQueryExecutor
from .executors.presto import PrestoQueryExecutor
from .executors.sqlalchemy import SnowflakeQueryExecutor, GenericSqlAlchemyQueryExecutor
from .executors.bigquery import BigQueryQueryExecutor


ALL_PLUGIN_EXECUTORS = import_plugin("executor_plugin", "ALL_PLUGIN_EXECUTORS", [])


ALL_EXECUTORS = [
    HiveQueryExecutor,
    PrestoQueryExecutor,
    BigQueryQueryExecutor,
    GenericSqlAlchemyQueryExecutor,
    SnowflakeQueryExecutor,
] + ALL_PLUGIN_EXECUTORS


def get_executor_class(language: str, name: str):
    for executor in ALL_EXECUTORS:
        if executor.match(language, name):
            return executor

    raise ValueError(f"Unknown executor {name} with language {language}")


# Re-export parse_exception
parse_exception
