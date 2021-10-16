import trino 
from lib.utils.utils import HTTPBasicAndProxyAuth
from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.query_executor.connection_string.trino import get_trino_connection_conf


class TrinoClient(ClientBaseClass):
    def __init__(
        self,
        connection_string,
        username=None,
        proxy_user=None,
        *args,
        **kwargs
    ):
        trino_conf = get_trino_connection_conf(connection_string)

        host = trino_conf.host
        port = 8080 if not trino_conf.port else trino_conf.port

        
        req_kwargs = {}

        if username and password:
            auth = (username, password)
            if proxy_user and impersonate:
                auth = HTTPBasicAndProxyAuth(
                    auth,  # Basic Auth
                    (proxy_user, "no pass"),  # proxy user auth, password not required
                )
            req_kwargs["auth"] = auth

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

    def cursor(self):
        return TrinoCursor(cursor=self._connection.cursor())


class TrinoCursor(CursorBaseClass):
    def __init__(self, cursor):
        self._cursor = cursor
        self._init_query_state_vars()

    def _init_query_state_vars(self):
        self._tracking_url = None
        self._percent_complete = 0

    def run(self, query: str):
        self._init_query_state_vars()
        self._cursor.execute(query)

    def cancel(self):
        print("Attempting to Cancle the Queries")
        self._cursor.cancel()

    def poll(self):
        # this needs to be take care
        poll_result = self._cursor.stats
        # PyHive does not support presto async, so we need to hack
        status = poll_result['state']
        print(status)

        print(poll_result)
        # Finished if status is not running or none
        completed = status not in (
            'FINISHED',
            'NONE',
        )

        if poll_result:
            self._update_percent_complete(poll_result)
            self._update_tracking_url(poll_result)

        return completed

    def get_one_row(self):
        return self._cursor.fetchone()

    def get_n_rows(self, n: int):
        return self._cursor.fetchmany(size=n)

    def get_columns(self):
        description = self._cursor.description
        if description is None:
            # Not a select query, no return
            return None
        else:
            columns = list(map(lambda d: d[0], description))
            return columns

    @property
    def tracking_url(self):
        return self._tracking_url

    @property
    def percent_complete(self):
        return self._percent_complete

    def _update_tracking_url(self, poll_result):
        if self._tracking_url is None:
            self._tracking_url = f"https://{self._cursor._request._host}:{self._cursor._request._port}/ui/plan.html?{poll_result['queryId']}"
    def _update_percent_complete(self, poll_result):
        completed_splits = poll_result.get("completedSplits", 0)
        total_splits = max(poll_result.get("totalSplits", 1), 1)
        self._percent_complete = (completed_splits * 100) / total_splits
        print(self._percent_complete)
