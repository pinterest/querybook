import re

from snowflake.connector import errors as sf_errors
from sqlalchemy.exc import SQLAlchemyError

from lib.query_executor.utils import get_parsed_syntax_error
from lib.query_executor.executors.sqlalchemy import SqlAlchemyQueryExecutor


class SnowflakeQueryExecutor(SqlAlchemyQueryExecutor):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "sqlalchemy-snowflake"

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
