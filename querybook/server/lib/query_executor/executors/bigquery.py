from google.cloud.bigquery.dbapi.exceptions import Error as BigQueryError

from const.query_execution import QueryExecutionErrorType
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.clients.bigquery import BigQueryClient
from lib.query_executor.executor_template.templates import bigquery_template


class BigQueryQueryExecutor(QueryExecutorBaseClass):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "bigquery"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "bigquery"

    @classmethod
    def _get_client(cls, client_setting):
        return BigQueryClient(**client_setting)

    @classmethod
    def EXECUTOR_TEMPLATE(cls):
        return bigquery_template

    def _parse_exception(self, e):
        error_type = QueryExecutionErrorType.INTERNAL.value
        error_str = str(e)
        error_extracted = None

        if isinstance(e, BigQueryError):
            error_type = QueryExecutionErrorType.ENGINE.value
        return error_type, error_str, error_extracted
