from lib.utils.import_helper import import_module_with_default
from .dag_exporter.demo_dag_exporter import DemoDAGExporter

ALL_PLUGIN_DAG_EXPORTERS = import_module_with_default(
    "dag_exporter_plugin",
    "ALL_PLUGIN_DAG_EXPORTERS",
    default=[DemoDAGExporter()],
)

ALL_DAG_EXPORTERS = ALL_PLUGIN_DAG_EXPORTERS

DEFAULT_DAG_EXPORTER = (
    ALL_DAG_EXPORTERS[0].dag_exporter_name if ALL_DAG_EXPORTERS else None
)


def get_dag_exporter_class(name: str):
    for dag_exporter in ALL_DAG_EXPORTERS:
        if dag_exporter.dag_exporter_name == name:
            return dag_exporter
    raise ValueError(f"Unknown dag exporter name {name}")
