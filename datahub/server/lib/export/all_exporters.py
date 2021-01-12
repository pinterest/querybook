from lib.utils.plugin import import_plugin


ALL_PLUGIN_EXPORTERS = import_plugin("exporter_plugin", "ALL_PLUGIN_EXPORTERS", [])

# No default exporter is provided
ALL_EXPORTERS = ALL_PLUGIN_EXPORTERS


def get_exporter(name: str):
    for exporter in ALL_EXPORTERS:
        if exporter.exporter_name == name:
            return exporter
    raise ValueError(f"Unknown exporter name {name}")
