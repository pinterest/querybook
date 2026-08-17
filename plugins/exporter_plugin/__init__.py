from lib.export.exporters.python_exporter import PythonExporter
from lib.export.exporters.r_exporter import RExporter

ALL_PLUGIN_EXPORTERS = [
    PythonExporter(),
    RExporter()
]
