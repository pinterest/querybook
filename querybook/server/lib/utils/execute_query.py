from app.db import with_session
from logic.admin import get_query_engine_by_id
from lib.query_executor.all_executors import get_executor_class
from lib.query_executor.executor_factory import get_client_setting_from_engine
from lib.query_analysis.statements import get_statements


class ExecuteQuery(object):
    def __init__(self, _async=False, poll_interval=5):
        """
        Args:
            _async (bool, optional): Whether or not to block the thread until completion. Defaults to False.
            poll_interval (int, optional): If not async, determine how frequent to poll for progress. Defaults to 5 (seconds).
        """
        self._async = _async
        self._poll_interval = poll_interval

        if _async:
            self._set_async_parameters()

    @with_session
    def __call__(
        self,
        query: str,
        engine_id: int,
        uid: int = None,
        session=None,
    ):
        """Start the query execution progress. If async then
           it just sets up the necessary variables, if sync
           then actually execute the query

        Args:
            query (str): Query getting executed
            engine_id (int): The id of the engine
            uid (int, optional): User id for proxy user. Defaults to None.
            session (SqlAlchemySession, optional): for querying database

        Returns:
            Any[][]: Returns the result if sync, otherwise None
        """
        engine = get_query_engine_by_id(engine_id, session=session)
        client_settings = get_client_setting_from_engine(engine, uid, session=session)
        self.executor = get_executor_class(engine.language, engine.executor)

        statements = parse_statement_from_query(self.executor, query)
        if len(statements) == 0:
            # Empty statement, return None
            return None

        cursor = self.executor._get_client(client_settings).cursor()
        if self._async:
            self._async_run(cursor, statements)
            return None
        else:
            return self._sync_run(cursor, statements)

    def _sync_run(self, cursor, statements):
        for statement in statements[:-1]:
            cursor.run(statement)
            cursor.poll_until_finish(self._poll_interval)
        cursor.run(statements[-1])
        cursor.poll_until_finish(self._poll_interval)
        return cursor.get()

    def _async_run(self, cursor, statements):
        self._cursor = cursor
        self._statements = statements
        self._set_async_parameters()

    def poll(self) -> bool:
        """
        Poll the async query,
        each poll can also make the query progress

        Returns:
            bool: True if it is finished, false otherwise
        """
        # Already finished
        if self._cur_index >= len(self._statements):
            return True

        # Start the query if progress is not set yet
        if len(self._progress) <= self._cur_index:
            self._cursor.run(self._statements[self._cur_index])
            self._progress.append(0)

        if self._cursor.poll():
            # If finished, move to the next index
            self._progress[self._cur_index] = 100
            self._cur_index += 1
        else:
            # Update the running statement's progress
            self._progress[self._cur_index] = self._cursor.percent_complete

        # If we reached the end of query
        is_query_finished = self._cur_index == len(self._statements)
        if is_query_finished:
            # Populate the result of the last query
            self._result = self._cursor.get()

        return is_query_finished

    @property
    def progress(self) -> float:
        """Get the query progress. Each statement has the same weight.
           New statement has a weight of 0 and finished statement has
           a weight of 100

        Returns:
            float: Progress between [0, 100]
        """
        num_statements = len(self._statements)
        if num_statements == 0:
            return 100

        return sum([progress / num_statements for progress in self._progress])

    @property
    def result(self):
        return self._result

    def _set_async_parameters(self):
        self._progress = []
        self._cur_index = 0
        self._result = None


def parse_statement_from_query(executor, query):
    if executor.SINGLE_QUERY_QUERY_ENGINE():
        statements = [query]
    else:
        statements = get_statements(query)

    return statements


execute_query = ExecuteQuery(False)
