from lib.export.base_exporter import BaseExporter


class RExporter(BaseExporter):
    @classmethod
    def EXPORTER_NAME(cls):
        return "Export to R"

    @classmethod
    def EXPORTER_TYPE(cls):
        return "text"

    @classmethod
    def export(cls, statement_execution_id, uid):
        download_url = cls.get_statement_execution_download_url(statement_execution_id)

        return """
library(tidyverse)
url <- "{}"
df <- read.csv(file=url)
`;
        """.format(
            download_url
        )
