from typing import Dict, List

from app.db import with_session
from logic.admin import get_query_engine_by_id
from lib.utils.import_helper import import_modules

from .base_exporter import BaseTableUploadExporter

ALL_TABLE_UPLOAD_EXPORTERS: List[BaseTableUploadExporter] = import_modules(
    [
        ("lib.table_upload.exporter.s3_exporter", "S3Exporter"),
        ("lib.table_upload.exporter.sqlalchemy_exporter", "SqlalchemyExporter"),
    ]
)
ALL_TABLE_UPLOAD_EXPORTER_BY_NAME: Dict[str, BaseTableUploadExporter] = {
    exporter_cls.__name__: exporter_cls for exporter_cls in ALL_TABLE_UPLOAD_EXPORTERS
}


@with_session
def get_exporter(
    engine_id, uid, table_config, importer, session=None
) -> BaseTableUploadExporter:
    query_engine = get_query_engine_by_id(engine_id, session=session)
    if not query_engine:
        raise Exception(f"Invalid query engine id {engine_id}")
    feature_params = query_engine.feature_params
    feature_params = {"upload_exporter": "SqlalchemyExporter"}

    if "upload_exporter" not in feature_params:
        raise Exception(f"Query engine {query_engine.name} does not have a exporter")

    upload_exporter_name = feature_params["upload_exporter"]
    if upload_exporter_name not in ALL_TABLE_UPLOAD_EXPORTER_BY_NAME:
        raise Exception(f"Invalid table exporter configure {upload_exporter_name}")

    exporter_cls: BaseTableUploadExporter = ALL_TABLE_UPLOAD_EXPORTER_BY_NAME[
        upload_exporter_name
    ]
    exporter = exporter_cls(uid, engine_id, importer, table_config)
    return exporter
