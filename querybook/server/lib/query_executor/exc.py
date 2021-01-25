class QueryExecutorException(Exception):
    pass


# AlreadyExecutedException
# This error will happen since we turned acks_late = True
# So in the event of worker unexpected crash, the task
# will get reassigned
class AlreadyExecutedException(QueryExecutorException):
    pass


class InvalidQueryExecution(QueryExecutorException):
    pass
