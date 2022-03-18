from typing import Dict
from app.flask_app import celery
from lib.export.all_exporters import get_exporter
from lib.logger import get_logger


LOG = get_logger(__file__)


@celery.task(bind=True)
def export_query_execution_task(
    self,
    exporter_name: str,
    statement_execution_id: int,
    current_user_id: int,
    exporter_params: Dict,
):
    exporter = get_exporter(exporter_name)
    try:
        info = exporter.export(
            statement_execution_id, current_user_id, **(exporter_params or {})
        )
        return {
            "type": exporter.exporter_type,
            "info": info,
        }
    except Exception as e:
        LOG.error(e)
        raise e
