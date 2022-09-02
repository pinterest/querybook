from enum import Enum

# Keep these the same as const/queryExecution.ts


class QueryExecutionType(Enum):
    ADHOC = "adhoc"
    SCHEDULED = "scheduled"


class QueryExecutionStatus(Enum):
    INITIALIZED = 0
    DELIVERED = 1
    RUNNING = 2
    DONE = 3
    ERROR = 4
    CANCEL = 5


class StatementExecutionStatus(Enum):
    INITIALIZED = 0
    RUNNING = 1
    UPLOADING = 2
    DONE = 3
    ERROR = 4
    CANCEL = 5


class QueryExecutionExportStatus(Enum):
    RUNNING = 0
    DONE = 1
    ERROR = 2


class QueryExecutionErrorType(Enum):
    INTERNAL = 0  # Error came from python exception caused by celery worker
    ENGINE = 1  # Error was thrown from the query engine
    SYNTAX = 2  # Error is thrown from query engine and is caused by syntax


class QueryEngineStatus(Enum):
    UNAVAILABLE = 0  # Information is not available
    GOOD = 1  # Executor is running without problem
    WARN = 2  # Executor is running with warnings
    ERROR = 3  # Executor is down, queries cannot be issued


QUERY_EXECUTION_NAMESPACE = "/query_execution"
