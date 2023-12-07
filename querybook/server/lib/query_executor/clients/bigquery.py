from clients.google_client import get_google_credentials
from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.utils.json import safe_loads


class BigQueryClient(ClientBaseClass):
    def __init__(self, google_credentials_json=None, *args, **kwargs):
        from google.cloud.bigquery import dbapi, Client

        parsed_google_json = (
            safe_loads(google_credentials_json)
            if google_credentials_json is not None
            else None
        )
        if parsed_google_json is not None:
            cred = get_google_credentials(parsed_google_json)
            client = Client(project=cred.project_id, credentials=cred)
        else:
            client = Client()

        self._conn = dbapi.connect(client=client)
        super(BigQueryClient, self).__init__()

    def cursor(self) -> CursorBaseClass:
        return BigQueryCursor(cursor=self._conn.cursor())


class BigQueryCursor(CursorBaseClass):
    def __init__(self, cursor):
        self._cursor = cursor

    def run(self, query):
        self._cursor.execute(query)

        # Caching the first row to allow column names
        self._first_row = self._cursor.fetchone()
        self._should_send_first_row = True

    def cancel(self):
        # Can't cancel (yet)
        pass

    def poll(self):
        # Query should immediately start to block after
        # run, so when it gets to poll it is already
        # finished
        return True

    def get_one_row(self):
        if self._should_send_first_row:
            self._should_send_first_row = False
            return self._convert_row(self._first_row)

        return self._convert_row(self._cursor.fetchone())

    def get_n_rows(self, n: int):
        def _fetch_k_rows(k: int):
            return [self._convert_row(row) for row in self._cursor.fetchmany(size=k)]

        if self._should_send_first_row:
            self._should_send_first_row = False
            return [self._convert_row(self._first_row)] + _fetch_k_rows(n - 1)
        return _fetch_k_rows(n)

    def get_columns(self):
        if not self._first_row:
            return None
        return list(self._first_row.keys())

    def _convert_row(self, row):
        if row:
            return list(row.values())
        return None
