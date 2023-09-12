from env import QuerybookSettings
from lib.stats_logger.all_stats_loggers import get_stats_logger_class


# metrics name
API_REQUESTS = "api.requests"
WS_CONNECTIONS = "ws.connections"
SQL_SESSION_FAILURES = "sql_session.failures"
TASK_FAILURES = "task.failures"
REDIS_OPERATIONS = "redis.operations"
QUERY_EXECUTIONS = "query.executions"


logger_name = QuerybookSettings.STATS_LOGGER_NAME
stats_logger = get_stats_logger_class(logger_name)
