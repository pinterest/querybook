class QueryExecutorException(Exception):
    pass


class AlreadyExecutedException(QueryExecutorException):
    """
    The error happens when we turned acks_late = True.
    In the event of worker unexpected crash, the task
    will get reassigned, which causes the worker to
    raise this error.
    """

    pass


class InvalidQueryExecution(QueryExecutorException):
    pass


class ArchivedQueryEngine(QueryExecutorException):
    pass
