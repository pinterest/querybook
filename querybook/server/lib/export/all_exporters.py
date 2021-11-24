from lib.utils.import_helper import import_module_with_default


ALL_PLUGIN_EXPORTERS = import_module_with_default(
    "exporter_plugin", "ALL_PLUGIN_EXPORTERS", default=[]
)

# No default exporter is provided
ALL_EXPORTERS = ALL_PLUGIN_EXPORTERS


def get_exporter(name: str):
    for exporter in ALL_EXPORTERS:
        if exporter.exporter_name == name:
            return exporter
    raise ValueError(f"Unknown exporter name {name}")
