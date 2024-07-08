from abc import ABCMeta, abstractclassmethod
import datetime
import time
from typing import Union, List

from app.db import DBSession
from app.flask_app import socketio


from const.db import description_length
from const.query_execution import (
    QueryExecutionStatus,
    StatementExecutionStatus,
    QUERY_EXECUTION_NAMESPACE,
)

from lib.form import AllFormField
from lib.logger import get_logger
from lib.query_executor.base_client import ClientBaseClass
from lib.query_executor.utils import (
    merge_str,
    parse_exception,
    format_if_internal_error_with_stack_trace,
)
from lib.result_store import GenericUploader
from lib.utils.csv import row_to_csv
from logic import query_execution as qe_logic


LOG = get_logger(__file__)


class QueryExecutorLogger(object):
    """This class is used to export data from query executor to redis/mysql/socketio

    Arguments:
        object {[type]} -- [description]

    Returns:
        [type] -- [description]
    """

    def __init__(self, query_execution_id, celery_task, query, statement_ranges):
        self._query_execution_id = query_execution_id

        self._celery_task = celery_task
        self._task_id = celery_task.request.id

        self.statement_execution_ids = []

        self._query = query
        self._statement_ranges = statement_ranges

        # logging variable
        self._has_log = False
        self._log_cache = ""  # [statement_logs]
        self._meta_info = None  # statement_urls
        self._percent_complete = 0  # percent_complete
        self._statement_progress = {}

        # Connect to mysql db
        with DBSession() as session:
            query_execution = qe_logic.update_query_execution(
                self._query_execution_id, task_id=self._task_id, session=session
            ).to_dict()

        # Emit a event from socketio
        socketio.emit(
            "query_received",
            query_execution,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )

    def on_query_start(self):
        with DBSession() as session:
            query_execution = qe_logic.update_query_execution(
                self._query_execution_id,
                status=QueryExecutionStatus.RUNNING,
                session=session,
            ).to_dict()

        query_execution = query_execution | {
            "total": len(self._statement_ranges),
        }

        socketio.emit(
            "query_start",
            query_execution,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )
        self.update_progress()

    def on_query_end(self):
        with DBSession() as session:
            query_execution = qe_logic.update_query_execution(
                self._query_execution_id,
                status=QueryExecutionStatus.DONE,
                completed_at=datetime.datetime.utcnow(),
                session=session,
            ).to_dict()

        socketio.emit(
            "query_end",
            query_execution,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )

    def reset_logging_variables(self):
        self._has_log = False
        self._log_cache = ""  # [statement_logs]
        self._meta_info = ""  # statement_urls
        self._percent_complete = None  # percent_complete

    def on_statement_start(self, statement_index):
        self.reset_logging_variables()

        statement_range = self._statement_ranges[statement_index]
        statement_start, statement_end = statement_range

        statement_execution = qe_logic.create_statement_execution(
            self._query_execution_id,
            statement_start,
            statement_end,
            StatementExecutionStatus.RUNNING,
        ).to_dict()
        statement_execution_id = statement_execution["id"]
        self.statement_execution_ids.append(statement_execution_id)

        socketio.emit(
            "statement_start",
            statement_execution,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )

    def on_statement_update(
        self,
        log: str = "",
        meta_info: str = None,
        percent_complete=None,
    ):
        statement_execution_id = self.statement_execution_ids[-1]

        updated_meta_info = False
        if meta_info is not None and self._meta_info != meta_info:
            self._meta_info = meta_info
            qe_logic.update_statement_execution(
                statement_execution_id, meta_info=meta_info
            )
            updated_meta_info = True

        has_log = len(log)
        if has_log:
            self._stream_log(statement_execution_id, log)

        percent_complete_change = (
            percent_complete is not None and self._percent_complete != percent_complete
        )
        if percent_complete_change:
            self._percent_complete = percent_complete

        if updated_meta_info or has_log or percent_complete_change:
            statement_update_dict = {
                "query_execution_id": self._query_execution_id,
                "id": statement_execution_id,
            }

            if updated_meta_info:
                statement_update_dict["meta_info"] = meta_info

            if has_log:
                statement_update_dict["log"] = [log]

            if percent_complete_change:
                statement_update_dict["percent_complete"] = percent_complete
                self._statement_progress = {
                    statement_execution_id: {
                        "percent_complete": percent_complete,
                    }
                }

                self.update_progress()

            socketio.emit(
                "statement_update",
                statement_update_dict,
                namespace=QUERY_EXECUTION_NAMESPACE,
                room=self._query_execution_id,
            )

    def on_statement_end(self, cursor):
        statement_execution_id = self.statement_execution_ids[-1]
        qe_logic.update_statement_execution(
            statement_execution_id,
            status=StatementExecutionStatus.UPLOADING,
        )

        socketio.emit(
            "statement_update",
            {
                "query_execution_id": self._query_execution_id,
                "id": statement_execution_id,
                "status": StatementExecutionStatus.UPLOADING.value,
            },
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )

        result_path, result_row_count = self._upload_query_result(
            cursor, statement_execution_id
        )
        upload_path, has_log = self._upload_log(statement_execution_id)

        statement_execution = qe_logic.update_statement_execution(
            statement_execution_id,
            status=StatementExecutionStatus.DONE,
            completed_at=datetime.datetime.utcnow(),
            result_row_count=result_row_count,
            has_log=self._has_log,
            result_path=result_path,
            log_path=upload_path if has_log else None,
        ).to_dict()

        self._statement_progress = {}
        self.update_progress()
        socketio.emit(
            "statement_end",
            statement_execution,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )

    def on_cancel(self):
        utcnow = datetime.datetime.utcnow()
        if len(self.statement_execution_ids) > 0:
            statement_execution_id = self.statement_execution_ids[-1]
            upload_path, has_log = self._upload_log(statement_execution_id)
            qe_logic.update_statement_execution(
                statement_execution_id,
                status=StatementExecutionStatus.CANCEL,
                completed_at=utcnow,
                has_log=self._has_log,
                log_path=upload_path if has_log else None,
            )

        with DBSession() as session:
            query_execution = qe_logic.update_query_execution(
                self._query_execution_id,
                status=QueryExecutionStatus.CANCEL,
                completed_at=utcnow,
                session=session,
            ).to_dict()

        socketio.emit(
            "query_cancel",
            query_execution,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=self._query_execution_id,
        )

    def on_exception(self, error_type: int, error_str: str, error_extracted: str):
        utcnow = datetime.datetime.utcnow()
        error_extracted = (
            error_extracted[:5000]
            if error_extracted is not None and len(error_extracted) > 5000
            else error_extracted
        )

        with DBSession() as session:
            if len(self.statement_execution_ids) > 0:
                statement_execution_id = self.statement_execution_ids[-1]
                upload_path, has_log = self._upload_log(statement_execution_id)

                qe_logic.update_statement_execution(
                    statement_execution_id,
                    status=StatementExecutionStatus.ERROR,
                    completed_at=utcnow,
                    has_log=self._has_log,
                    log_path=upload_path if has_log else None,
                    session=session,
                )

            qe_logic.create_query_execution_error(
                self._query_execution_id,
                error_type=error_type,
                error_message_extracted=error_extracted,
                error_message=error_str,
                session=session,
            )

            query_execution = qe_logic.update_query_execution(
                self._query_execution_id,
                status=QueryExecutionStatus.ERROR,
                completed_at=utcnow,
                session=session,
            ).to_dict()

            socketio.emit(
                "query_exception",
                query_execution,
                namespace=QUERY_EXECUTION_NAMESPACE,
                room=self._query_execution_id,
            )

    def update_progress(self):
        progress = self._statement_progress | {
            "total": len(self._statement_ranges),
        }

        self._celery_task.update_state(state="PROGRESS", meta=progress)

    def _upload_query_result(self, cursor, statement_execution_id: int):
        # While uploading, the first few rows are fetched and stored as well
        # CACHE_ROW_SIZE = 50000  the number of rows stored to mysql, keep it < than previous value
        rows_uploaded = 0
        columns = cursor.get_columns()
        if (
            columns is None or len(columns) == 0
        ):  # No need to go through queries because no information
            return None, rows_uploaded

        key = "querybook_temp/%s/result.csv" % str(statement_execution_id)
        uploader = GenericUploader(key)
        uploader.start()

        uploader.write(row_to_csv(columns))
        rows_uploaded += 1  # 1 row for the column

        for row in cursor.get_rows_iter():
            did_upload = uploader.write(row_to_csv(row))
            if not did_upload:
                break
            rows_uploaded += 1
        uploader.end()

        return uploader.upload_url, rows_uploaded

    def _upload_log(self, statement_execution_id: int):
        db_read_limit = 50
        db_read_offset = 0

        try:
            self._stream_log(statement_execution_id, "", clear_cache=True)

            logs = []
            has_log = False
            log_path = None

            with DBSession() as session:
                while True:
                    log_rows = qe_logic.get_statement_execution_stream_logs(
                        statement_execution_id,
                        limit=db_read_limit,
                        offset=db_read_offset,
                        session=session,
                    )

                    logs += map(lambda log: log.log, log_rows)

                    if len(log_rows) < db_read_limit:
                        break
                    db_read_offset += db_read_limit

            if len(logs):
                has_log = True
                uri = f"querybook_temp/{statement_execution_id}/log.txt"
                with GenericUploader(uri) as uploader:
                    log_path = uploader.upload_url

                    for log in logs:
                        did_upload = uploader.write(log)
                        if not did_upload:
                            break
                qe_logic.delete_statement_execution_stream_log(
                    statement_execution_id, session=session
                )
            return log_path, has_log
        except Exception as e:
            import traceback

            LOG.error(
                f"{e}\n{traceback.format_exc()}"
                + "Failed to upload logs. Silently suppressing error"
            )

    def _stream_log(
        self, statement_execution_id: int, log: str, clear_cache: bool = False
    ):
        """
        Persists the log in DB that's over description_length
        for them to be read from frontend while query is running

        Arguments:
            statement_execution_id {int}
            log {str} -- Incoming new log

        Keyword Arguments:
            clear_cache {bool} -- [If true, will push all _log_cache into mysql DB] (default: {False})
        """
        merged_log = merge_str(self._log_cache, log)
        created_log = False
        chunk_size = description_length
        cache_length = 0 if clear_cache else chunk_size

        with DBSession() as session:
            while len(merged_log) > cache_length:
                size_of_chunk = min(len(merged_log), chunk_size)

                log_chunk = merged_log[:size_of_chunk]
                qe_logic.create_statement_execution_stream_log(
                    statement_execution_id, log_chunk, commit=False, session=session
                )
                created_log = True
                merged_log = merged_log[size_of_chunk:]

            if not self._has_log and created_log:
                qe_logic.update_statement_execution(
                    statement_execution_id,
                    has_log=True,
                    log_path="stream://",
                    session=session,
                )
                self._has_log = True

            session.commit()

        self._log_cache = merged_log


class QueryExecutorBaseClass(metaclass=ABCMeta):
    """Base query executor class to run queries
    When extending, MUST IMPLEMENT:
         _get_cursor which returns an extended value of CursorBaseClass
         EXECUTOR_NAME which should be a string to represent the query executor
         EXECUTOR_LANGUAGE which the language of query (ex presto, mysql)
         EXECUTOR_TEMPLATE represents the shape of client_setting
    """

    @abstractclassmethod
    def _get_client(cls, client_setting) -> ClientBaseClass:
        """Return the corresponding QueryCursor class

        Arguments:
            client_setting {dictionary} -- The customizable input to start the client
        """
        raise NotImplementedError

    @abstractclassmethod
    def EXECUTOR_LANGUAGE(cls) -> Union[str, List[str]]:
        """Indicate corresponding the query language"""
        raise NotImplementedError

    @abstractclassmethod
    def EXECUTOR_NAME(cls) -> str:
        """Distinct name for the executor.
        Must be distinct under for the same language.
        """
        raise NotImplementedError

    @abstractclassmethod
    def EXECUTOR_TEMPLATE(cls) -> AllFormField:
        """Describes the shape of the client_settings that goes into _get_cursor"""
        raise NotImplementedError

    @classmethod
    def SINGLE_QUERY_QUERY_ENGINE(cls) -> bool:
        """If true, skip parsing and feed the entire query as a statement at once"""
        return False

    @classmethod
    def LOGGER_CLASS(cls) -> QueryExecutorLogger:
        return QueryExecutorLogger

    @classmethod
    def match(cls, language: str, name: str) -> bool:
        if name != cls.EXECUTOR_NAME():
            return False

        executor_language = cls.EXECUTOR_LANGUAGE()
        if isinstance(executor_language, str):
            return executor_language == language
        else:
            # executor_language is List[str]
            return language in executor_language

    @property
    def query_execution_id(self):
        return self._query_execution_id

    @property
    def execution_type(self):
        return self._execution_type

    def __init__(
        self,
        query_execution_id: int,
        celery_task,
        query: str,
        statement_ranges,
        client_setting,
        execution_type,
    ):
        self._query = query
        self._query_execution_id = query_execution_id
        self._execution_type = execution_type

        if self.SINGLE_QUERY_QUERY_ENGINE():
            self._statement_ranges = [[0, len(query)]]
        else:
            self._statement_ranges = statement_ranges
        self._current_query_index = -1

        self.status = QueryExecutionStatus.DELIVERED

        # Initialize logger
        self._logger = self.LOGGER_CLASS()(
            query_execution_id,
            celery_task,
            self._query,
            self._statement_ranges,
        )

        # Initialize cursor once poll loop is setup
        self._client_setting = client_setting
        self._client = None
        self._cursor = None

        query_execution_metadata = (
            qe_logic.get_query_execution_metadata_by_execution_id(
                self._query_execution_id
            )
        )
        if query_execution_metadata:
            self._used_api_token = query_execution_metadata.execution_metadata.get(
                "used_api_token", False
            )
        else:
            self._used_api_token = False

    def __del__(self):
        del self._logger
        del self._cursor
        del self._client

    def start(self):
        self._logger.on_query_start()

        self.status = QueryExecutionStatus.RUNNING
        self._current_query_index = 0

        # Connect to data client
        del self._cursor
        self._cursor = self._get_cursor()

        self._start_time = time.time()
        self._run_next_statement()

    def poll(self):
        try:
            if self.status == QueryExecutionStatus.DELIVERED:
                self.start()
            elif self.status != QueryExecutionStatus.RUNNING:
                return

            current_statement_completed = self._is_statement_completed()
            # Completed
            if current_statement_completed:
                self._on_statement_completion()
                self._run_next_statement()
        except Exception as e:
            # from celery.contrib import rdb; rdb.set_trace()

            import traceback

            stack_trace = "".join(traceback.format_tb(e.__traceback__))
            error_message = f"{e}\n{stack_trace}"
            LOG.error(error_message)
            self._handle_exception(e, stack_trace)

    def sleep(self):
        # For the first 15 mins, we check every second
        # Afterwards, check every 10 seconds
        time_passed = time.time() - self._start_time  # unit in seconds
        sleep_time = 1 if time_passed < 900 else 10
        time.sleep(sleep_time)

    @property
    def meta_info(self):
        info = ""
        if self._cursor.tracking_url:
            info += f"Tracking Url: {self._cursor.tracking_url}\n"
        return info

    def cancel(self):
        self.status = QueryExecutionStatus.CANCEL
        self._logger.on_cancel()

        if self._current_query_index >= 0:
            self._cursor.cancel()

    def _run_next_statement(self):
        if self._current_query_index < len(self._statement_ranges):
            self._logger.on_statement_start(self._current_query_index)

            statement_range = self._statement_ranges[self._current_query_index]
            statement_start, statement_end = statement_range

            statement = self._query[statement_start:statement_end]
            self._execute(statement)
            self._current_query_index += 1
        else:
            self._on_query_completion()

    def _handle_exception(self, exc: Exception, stack_trace: str):
        try:
            # Try our best to fetch logs again
            if self._cursor:
                self._logger.on_statement_update(
                    log=self._get_logs(), meta_info=self.meta_info
                )
        except Exception:
            # In case of failure just ignore
            pass
        finally:
            # Update logger
            error_type, error_str, error_extracted = self._parse_exception(exc)
            self._logger.on_exception(
                error_type,
                format_if_internal_error_with_stack_trace(
                    exc, error_type, error_str, stack_trace
                ),
                error_extracted,
            )

            # Finally update the executor status
            # The logger might fail as well, so update the executor status last
            # Since in case of failure, it is expected that the caller of executor
            # to update the db status
            self.status = QueryExecutionStatus.ERROR

    def _on_statement_completion(self):
        self._logger.on_statement_end(self._cursor)

    def _on_query_completion(self):
        self._logger.on_query_end()
        self.status = QueryExecutionStatus.DONE

    def _execute(self, statement):
        self._cursor.run(statement)

    def _is_statement_completed(self):
        completed = self._cursor.poll()

        self._logger.on_statement_update(
            log=self._get_logs(),
            percent_complete=self._cursor.percent_complete,
            meta_info=self.meta_info,
        )

        return completed

    def _get_cursor(self):
        if self._client is None:
            self._client = self._get_client(self._client_setting)

        return self._client.cursor()

    def _get_logs(self):
        return self._cursor.get_logs()

    def _parse_exception(self, e):
        return parse_exception(e)
