from lib.data_doc.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger

LOG = get_logger(__file__)


# TODO: rename
class DemoDAGExporter(BaseDAGExporter):
    @property
    def dag_exporter_name(self):
        return "demo"

    @property
    def dag_exporter_type(self):
        return "text"

    @property
    def dag_exporter_meta(self):
        # TODO: use FormField
        return {}

    def export(self, nodes, edges, meta):
        try:
            # TODO: export to file
            return "url"
        except Exception as e:
            LOG.info(e)
