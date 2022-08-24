from typing import Dict

from app.db import with_session
from logic.admin import get_query_engine_by_id
from lib.utils.import_helper import import_module_with_default

from .base_exporter import BaseTableUploadExporter

ALL_PLUGIN_EXPORTERS: Dict[str, BaseTableUploadExporter] = import_module_with_default(
    "table_uploader_plugin", "ALL_PLUGIN_TABLE_UPLOAD_EXPORTERS", default={}
)

ALL_TABLE_UPLOAD_EXPORTER_BY_NAME: Dict[str, BaseTableUploadExporter] = {}

SqlalchemyExporter = import_module_with_default(
    "lib.table_upload.exporter.sqlalchemy_exporter", "SqlalchemyExporter", default=None
)
if SqlalchemyExporter:
    ALL_TABLE_UPLOAD_EXPORTER_BY_NAME["SqlalchemyExporter"] = SqlalchemyExporter()

ALL_TABLE_UPLOAD_EXPORTER_BY_NAME |= ALL_PLUGIN_EXPORTERS


@with_session
def get_table_upload_exporter(engine_id, session=None) -> BaseTableUploadExporter:
    query_engine = get_query_engine_by_id(engine_id, session=session)
    if not query_engine:
        raise Exception(f"Invalid query engine id {engine_id}")
    feature_params = query_engine.feature_params

    if "upload_exporter" not in feature_params:
        raise Exception(f"Query engine {query_engine.name} does not have a exporter")

    upload_exporter_name = feature_params["upload_exporter"]
    if upload_exporter_name not in ALL_TABLE_UPLOAD_EXPORTER_BY_NAME:
        raise Exception(f"Invalid table exporter configure {upload_exporter_name}")

    exporter: BaseTableUploadExporter = ALL_TABLE_UPLOAD_EXPORTER_BY_NAME[
        upload_exporter_name
    ]
    return exporter
