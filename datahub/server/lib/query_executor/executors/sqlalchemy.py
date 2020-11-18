import re
from sqlalchemy.exc import SQLAlchemyError, DBAPIError
from snowflake.connector import errors as sf_errors

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
        return "sqlalchemy"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "druid"


class SqliteQueryExecutor(SqlAlchemyQueryExecutor):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "sqlalchemy"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "sqlite"


class SnowflakeQueryExecutor(SqlAlchemyQueryExecutor):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "sqlalchemy"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "snowflake"

    def _parse_exception(self, e):
        if isinstance(e, SQLAlchemyError):
            orig_error = getattr(e, "orig", None)

            if isinstance(orig_error, sf_errors.ProgrammingError):
                message = orig_error.msg
                match = re.search(r"error line (\d+) at position (\d+)", message)
                if match is not None:
                    return get_parsed_syntax_error(
                        message, int(match.group(1)) - 1, int(match.group(2))
                    )
        return super(SnowflakeQueryExecutor, self)._parse_exception(e)
