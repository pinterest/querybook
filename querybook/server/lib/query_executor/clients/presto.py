from typing import Any, Dict, Optional, Tuple
from pyhive import presto

from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.query_executor.clients.utils.presto_cursor import PrestoCursorMixin
from lib.query_executor.connection_string.presto import get_presto_connection_conf


class PrestoCursor(PrestoCursorMixin[presto.Cursor, Tuple], CursorBaseClass):
    def __init__(self, cursor: presto.Cursor) -> None:
        self._cursor = cursor
        self._init_query_state_vars()

    def _init_query_state_vars(self) -> None:
        self._tracking_url = None
        self._percent_complete = 0

    def poll(self) -> bool:
        poll_result = self._cursor.poll()

        # PyHive does not support presto async, so we need to hack
        status = self._cursor._state
        # Finished if status is not running or none
        completed = status not in (
            self._cursor._STATE_RUNNING,
            self._cursor._STATE_NONE,
        )

        if poll_result:
            self._update_percent_complete(poll_result)
            self._update_tracking_url(poll_result)

        return completed

    def _update_percent_complete(self, poll_result: Dict[str, Any]) -> None:
        stats = poll_result.get("stats", {})
        completed_splits = stats.get("completedSplits", 0)
        total_splits = max(stats.get("totalSplits", 1), 1)
        self._percent_complete = (completed_splits * 100) / total_splits

    def _update_tracking_url(self, poll_result: Dict[str, Any]) -> None:
        if self._tracking_url is None:
            self._tracking_url = poll_result.get("infoUri", None)


class PrestoClient(ClientBaseClass):
    def __init__(
        self,
        connection_string: str,
        username: Optional[str] = None,
        password: Optional[str] = None,
        proxy_user: Optional[str] = None,
        impersonate: bool = False,
        connection_timeout: int = None,
        *args: Any,
        **kwargs: Any
    ) -> None:
        presto_conf = get_presto_connection_conf(connection_string)

        host = presto_conf.host
        port = 8080 if not presto_conf.port else presto_conf.port

        requests_kwargs = {}
        if connection_timeout and connection_timeout > 0:
            requests_kwargs["timeout"] = connection_timeout

        connection = presto.connect(
            host,
            port=port,
            principal_username=proxy_user if impersonate and proxy_user else username,
            username=username,
            password=password,
            catalog=presto_conf.catalog,
            schema=presto_conf.schema,
            source="querybook",
            protocol=presto_conf.protocol,
            requests_kwargs=requests_kwargs,
        )
        self._connection = connection
        super(PrestoClient, self).__init__()

    def cursor(self) -> PrestoCursor:
        return PrestoCursor(cursor=self._connection.cursor())
