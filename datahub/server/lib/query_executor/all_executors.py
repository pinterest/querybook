from lib.utils.plugin import import_plugin
from .base_executor import parse_exception

from .executors.hive import HiveQueryExecutor
from .executors.presto import PrestoQueryExecutor
from .executors.sqlalchemy import MysqlQueryExecutor, DruidQueryExecutor
from .executors.bigquery import BigQueryQueryExecutor


ALL_PLUGIN_EXECUTORS = import_plugin("executor_plugin", "ALL_PLUGIN_EXECUTORS", [])


ALL_EXECUTORS = [
    HiveQueryExecutor,
    PrestoQueryExecutor,
    MysqlQueryExecutor,
    DruidQueryExecutor,
    BigQueryQueryExecutor,
] + ALL_PLUGIN_EXECUTORS


def get_executor_class(name: str):
    for executor in ALL_EXECUTORS:
        if executor.EXECUTOR_NAME() == name:
            return executor

    raise ValueError(f"Unknown executor name {name}")


# Re-export parse_exception
parse_exception
