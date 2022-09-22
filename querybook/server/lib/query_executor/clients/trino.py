from typing import Any, Dict, List, Optional

import trino
from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.query_executor.clients.utils.presto_cursor import PrestoCursorMixin
from lib.query_executor.connection_string.trino import get_trino_connection_conf


class TrinoCursor(PrestoCursorMixin[trino.dbapi.Cursor, List[Any]], CursorBaseClass):
    def __init__(self, cursor: trino.dbapi.Cursor) -> None:
        self._cursor = cursor
        self.rows = []
        self._init_query_state_vars()
        self._request = cursor._request

    def _init_query_state_vars(self) -> None:
        self.rows = []
        self._tracking_url = None
        self._percent_complete = 0

    def poll(self) -> bool:
        # this needs to be take care
        self.rows.extend(self._cursor._query.fetch())
        self._cursor._iterator = iter(self.rows)
        poll_result = self._cursor.stats
        completed = self._cursor._query._finished
        if poll_result:
            self._update_percent_complete(poll_result)
            self._update_tracking_url(poll_result)

        return completed

    def _update_tracking_url(self, poll_result: Dict[str, Any]) -> None:
        if self._tracking_url is None:
            self._tracking_url = f"{self._request._http_scheme}://{self._request._host}:{self._request._port}/ui/plan.html?{poll_result['queryId']}"

    def _update_percent_complete(self, poll_result: Dict[str, Any]) -> None:
        self._percent_complete = poll_result.get("progressPercentage", 0)


class TrinoClient(ClientBaseClass):
    def __init__(
        self,
        connection_string: str,
        username: Optional[str] = None,
        proxy_user: Optional[str] = None,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        trino_conf = get_trino_connection_conf(connection_string)

        host = trino_conf.host
        port = 8080 if not trino_conf.port else trino_conf.port

        connection = trino.dbapi.connect(
            host=host,
            port=port,
            catalog=trino_conf.catalog,
            schema=trino_conf.schema,
            user=proxy_user or username,
            http_scheme=trino_conf.protocol,
        )
        self._connection = connection
        super(TrinoClient, self).__init__()

    def cursor(self) -> TrinoCursor:
        return TrinoCursor(cursor=self._connection.cursor())
