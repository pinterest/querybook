from pyhive import presto

from lib.utils.utils import HTTPBasicAndProxyAuth
from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.query_executor.connection_string.presto import get_presto_connection_conf


class PrestoClient(ClientBaseClass):
    def __init__(
        self,
        connection_string,
        username=None,
        password=None,
        proxy_user=None,
        impersonate=False,
        *args,
        **kwargs
    ):
        presto_conf = get_presto_connection_conf(connection_string)

        host = presto_conf.host
        port = 8080 if not presto_conf.port else presto_conf.port

        # default to querybook credentials if user/pwd is not supplied
        # we pass auth credentials through requests_kwargs instead of
        # using requests library's builtin auth to bypass the https requirement
        # and set the proper Authorization header
        req_kwargs = {}

        if username and password:
            auth = (username, password)
            if proxy_user and impersonate:
                auth = HTTPBasicAndProxyAuth(
                    auth,  # Basic Auth
                    (proxy_user, "no pass"),  # proxy user auth, password not required
                )
            req_kwargs["auth"] = auth

        connection = presto.connect(
            host,
            port=port,
            username=proxy_user or username,
            catalog=presto_conf.catalog,
            schema=presto_conf.schema,
            source="querybook",
            protocol=presto_conf.protocol,
            requests_kwargs=req_kwargs,
        )
        self._connection = connection
        super(PrestoClient, self).__init__()

    def cursor(self):
        return PrestoCursor(cursor=self._connection.cursor())


class PrestoCursor(CursorBaseClass):
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
        self._cursor.cancel()

    def poll(self):
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

    def _update_percent_complete(self, poll_result):
        stats = poll_result.get("stats", {})
        completed_splits = stats.get("completedSplits", 0)
        total_splits = max(stats.get("totalSplits", 1), 1)
        self._percent_complete = (completed_splits * 100) / total_splits

    def _update_tracking_url(self, poll_result):
        if self._tracking_url is None:
            self._tracking_url = poll_result.get("infoUri", None)
