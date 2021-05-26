from lib.export.base_exporter import BaseExporter


class RExporter(BaseExporter):
    @property
    def exporter_name(self):
        return "Export to R"

    @property
    def exporter_type(self):
        return "text"

    def export(self, statement_execution_id, uid):
        download_url = self._get_statement_execution_download_url(
            statement_execution_id
        )

        return """
library(tidyverse)
url <- "{}"
df <- read.csv(file=url)
""".format(
            download_url
        )
