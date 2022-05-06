import json
from app.datasource import register
from flask import request

from lib.table_upload.exporter.sqlalchemy_exporter import SqlalchemyExporter
from lib.table_upload.importer.importer_factory import get_importer


@register("/table_upload/preview/", methods=["POST"])
def get_upload_rows_preview():
    import_config = json.loads(request.form["import_config"])
    file_uploaded = request.files.get("file")

    importer = get_importer(import_config, file_uploaded)

    return importer.get_columns()


@register("/table_upload/", methods=["POST"])
def perform_table_upload():
    import_config = json.loads(request.form["import_config"])
    file_uploaded = request.files.get("file")

    table_config = json.loads(request.form["table_config"])
    engine_id = request.form["engine_id"]

    importer = get_importer(import_config, file_uploaded)
    exporter = SqlalchemyExporter(engine_id, importer, table_config)
    return exporter.upload()
