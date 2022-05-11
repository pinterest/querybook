from lib.data_doc.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger
from lib.form import StructFormField, FormField
from lib.form import FormFieldType


LOG = get_logger(__file__)


# TODO: rename
class DemoDAGExporter(BaseDAGExporter):
    @property
    def dag_exporter_name(self):
        return "demo"

    @property
    def dag_exporter_type(self):
        return "url"

    @property
    def dag_exporter_meta(self):
        # TODO: use FormField
        return StructFormField(
            input=FormField(description="sample input field"),
            checkbox=FormField(field_type=FormFieldType.Boolean),
            select=FormField(
                field_type=FormFieldType.Select,
                options=["Sample Option 1", "Sample Option 2"],
            ),
        )

    def export(self, nodes, edges, meta):
        try:
            return "https://www.querybook.org/"
        except Exception as e:
            LOG.info(e)
