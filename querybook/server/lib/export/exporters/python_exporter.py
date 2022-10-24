from lib.export.base_exporter import BaseExporter


class PythonExporter(BaseExporter):
    @property
    def exporter_name(self):
        return "Export to Python"

    @property
    def exporter_type(self):
        return "text"

    def export(self, statement_execution_id, uid):
        download_url = self._get_statement_execution_download_url(
            statement_execution_id
        )

        return """
url = "{}"

import requests
import pandas
from io import StringIO

with requests.Session() as s:
    download = s.get(url)
    decoded_content = download.content.decode('utf-8')
    df = pandas.read_csv(StringIO(decoded_content))
        """.format(
            download_url
        )
