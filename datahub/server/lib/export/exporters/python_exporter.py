from lib.export.base_exporter import BaseExporter


class PythonExporter(BaseExporter):
    @classmethod
    def EXPORTER_NAME(cls):
        return "Export to Python"

    @classmethod
    def EXPORTER_TYPE(cls):
        return "text"

    @classmethod
    def export(cls, statement_execution_id, uid):
        download_url = cls.get_statement_execution_download_url(statement_execution_id)

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
