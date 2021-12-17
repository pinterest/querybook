from redshift_connector import error as rs_errors
from sqlalchemy.exc import SQLAlchemyError
from const.query_execution import QueryExecutionErrorType

from lib.query_executor.executors.sqlalchemy import SqlAlchemyQueryExecutor


class RedshiftQueryExecutor(SqlAlchemyQueryExecutor):
    @classmethod
    def EXECUTOR_NAME(cls):
        return "sqlalchemy-redshift"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "redshift"

    def _parse_exception(self, e):
        if isinstance(e, SQLAlchemyError):
            orig_error = getattr(e, "orig", None)

            if isinstance(orig_error, rs_errors.Error):
                error_type = QueryExecutionErrorType.ENGINE.value
                error_msg = getattr(e, "args", None)
                error_extracted = None

                if error_msg is not None:
                    return error_type, str(error_msg), error_extracted
        return super(RedshiftQueryExecutor, self)._parse_exception(e)
