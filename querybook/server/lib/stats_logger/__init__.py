from env import QuerybookSettings
from lib.stats_logger.all_stats_loggers import get_stats_logger_class
from .base_stats_logger import BaseStatsLogger


# metrics name templates
API_REQUEST_COUNTER = "api.{}"
API_REQUEST_LATENCY_TIMER = "api.duration.ms.{}"
WS_CONNECTIONS_COUNTER = "ws.connections"
SQL_SESSION_FAILURE_COUNTER = "sql.session.failure"
SYSTEM_TASK_FAILURE_COUNTER = "task.failure.system"
DATADOC_TASK_FAILURE_COUNTER = "task.failure.datadoc"
REDIS_LATENCY_TIMER = "redis.duration.ms.{}"
QUERY_EXECUTION_COUNTER = "query_execution.{}"

logger_name = QuerybookSettings.STATS_LOGGER_NAME
stats_logger: BaseStatsLogger = get_stats_logger_class(logger_name)
