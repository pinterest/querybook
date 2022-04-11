from trino.exceptions import Error, TrinoQueryError

from const.query_execution import QueryExecutionErrorType
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.utils import get_parsed_syntax_error
from lib.query_executor.clients.trino import TrinoClient
from lib.query_executor.executor_template.templates import trino_executor_template


def get_trino_error_dict(e):
    if hasattr(e, "args") and e.args[0] is not None:
        error_arg = e.args[0]
        if type(error_arg) is dict:
            return error_arg
    return None


class TrinoQueryExecutor(QueryExecutorBaseClass):
    @classmethod
    def _get_client(cls, client_setting):
        return TrinoClient(**client_setting)

    @classmethod
    def EXECUTOR_NAME(cls):
        return "trino"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "trino"

    @classmethod
    def EXECUTOR_TEMPLATE(cls):
        return trino_executor_template

    def _parse_exception(self, e):
        error_type = QueryExecutionErrorType.INTERNAL.value
        error_str = str(e)
        error_extracted = None

        if isinstance(e, TrinoQueryError):
            try:
                line_number, column_number = e.error_location
                return get_parsed_syntax_error(
                    e.message,
                    line_number - 1,
                    column_number - 1,
                )
            except Exception:
                return QueryExecutionErrorType.ENGINE.value, e.message, error_extracted

        if isinstance(e, Error):
            error_type = QueryExecutionErrorType.ENGINE.value
            try:
                error_dict = get_trino_error_dict(e)
                if error_dict:
                    error_extracted = error_dict.get("message", None)
            except Exception:
                pass
        return error_type, error_str, error_extracted
