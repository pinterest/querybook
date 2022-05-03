from lib.data_doc.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger

LOG = get_logger(__file__)


class DemoDAGExporter(BaseDAGExporter):
    @property
    def dag_exporter_name(self):
        return "demo"

    @property
    def dag_exporter_meta(self):
        return "{}"

    def export(self, nodes, edges, meta):
        try:
            # exporting
            print(nodes, edges, meta)
        except Exception as e:
            LOG.info(e)
