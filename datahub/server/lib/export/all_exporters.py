from lib.utils.plugin import import_plugin

ALL_PLUGIN_EXPORTERS = import_plugin("exporter_plugin", "ALL_PLUGIN_EXPORTERS", [])

# No default exporter is provided
ALL_EXPORTERS = ALL_PLUGIN_EXPORTERS


def get_exporter_class(name: str):
    for exporter in ALL_EXPORTERS:
        if exporter.EXPORTER_NAME() == name:
            return exporter
    raise ValueError(f"Unknown exporter name {name}")
