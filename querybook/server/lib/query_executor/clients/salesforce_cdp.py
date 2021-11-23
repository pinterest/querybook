from clients.google_client import get_google_credentials
from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.utils.json import safe_loads
import jaydebeapi

class SalesforceCdpClient(ClientBaseClass):
    def __init__(self, username=None, password=None, loginurl=None, *args, **kwargs):
        connection_string = 'jdbc:queryService-jdbc:' + loginurl
        props = [username, password]
        self._conn = jaydebeapi.connect('com.salesforce.cdp.queryservice.QueryServiceDriver',
                        connection_string,
                        props,
                        '/opt/querybook/Salesforce-CDP-jdbc-1.10.0-java8.jar')
        super(SalesforceCdpClient, self).__init__()

    def cursor(self) -> CursorBaseClass:
        return SalesforceCdpCursor(cursor=self._conn.cursor())


class SalesforceCdpCursor(CursorBaseClass):
    def __init__(self, cursor):
        self._cursor = cursor

    def run(self, query):
        self._cursor.execute(query)

    def cancel(self):
        # Can't cancel (yet)
        pass

    def poll(self):
        # Query should immediately start to block after
        # run, so when it gets to poll it is already
        # finished
        return True

    def get_one_row(self):
        return self._convert_row(self._cursor.fetchone())

    def get_n_rows(self, n: int):
        converted_records = []
        if self._cursor:
            records = self._cursor.fetchmany(size=n)
            if records:
                for r in records:
                    converted_record = self._convert_row(r)
                    converted_records.append(converted_record)
        return converted_records

    def get_columns(self):
        columns = []
        for c in self._cursor.description:
            columns.append(c[0])
        return columns

    def _convert_row(self, row):
        if row:
            return list(row)
        return None
