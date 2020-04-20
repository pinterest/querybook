import re
from sqlalchemy.exc import SQLAlchemyError, DBAPIError

from const.query_execution import QueryExecutionErrorType
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.clients.sqlalchemy import SqlAlchemyClient
from lib.query_executor.executor_template.templates import sqlalchemy_template
from lib.query_executor.utils import get_parsed_syntax_error


class SqlAlchemyQueryExecutor(QueryExecutorBaseClass):
    @classmethod
    def _get_client(cls, client_setting):
        return SqlAlchemyClient(**client_setting)

    @classmethod
    def EXECUTOR_TEMPLATE(cls):
        return sqlalchemy_template

    def _parse_exception(self, e):
        error_type = QueryExecutionErrorType.INTERNAL.value
        error_str = str(e)
        error_extracted = None

        if isinstance(e, SQLAlchemyError):
            error_type = QueryExecutionErrorType.ENGINE.value
            if isinstance(e, DBAPIError) and len(e.orig.args) == 2:
                code, message = e.orig.args
                if code == 1064:
                    match = re.search(r"at line (\d+)", message)
                    return get_parsed_syntax_error(
                        str(e.orig.args),
                        int(match.group(1)) - 1 if match is not None else None,
                    )
        return error_type, error_str, error_extracted


class MysqlQueryExecutor(SqlAlchemyQueryExecutor):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "sqlalchemy"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "mysql"


class DruidQueryExecutor(SqlAlchemyQueryExecutor):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "druid-sqlalchemy"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "druid"
