from app.flask_app import celery, socketio
from const.data_doc import DATA_DOC_NAMESPACE
from const.query_execution import QueryExecutionExportStatus
from lib.export.all_exporters import get_exporter
from lib.logger import get_logger


LOG = get_logger(__file__)


@celery.task(bind=True)
def export_query_execution_task(
    self,
    exporter_name: str,
    statement_execution_id: int,
    current_user_id: int,
    socket_id: int,
    **exporter_params,
):
    socketio.emit(
        "export_status_info",
        {
            "task_id": self.request.id,
            "statement_id": statement_execution_id,
            "status": QueryExecutionExportStatus.RUNNING.value,
        },
        namespace=DATA_DOC_NAMESPACE,
        room=socket_id,
        broadcast=True,
    )

    exporter = get_exporter(exporter_name)

    try:
        info = exporter.export(
            statement_execution_id, current_user_id, **(exporter_params or {})
        )
        socketio.emit(
            "export_status_info",
            {
                "task_id": self.request.id,
                "statement_id": statement_execution_id,
                "status": QueryExecutionExportStatus.DONE.value,
                "result": {"type": exporter.exporter_type, "info": info,},
            },
            namespace=DATA_DOC_NAMESPACE,
            room=socket_id,
            broadcast=True,
        )
    except Exception as e:
        socketio.emit(
            "export_status_info",
            {
                "task_id": self.request.id,
                "statement_id": statement_execution_id,
                "status": QueryExecutionExportStatus.ERROR.value,
                "message": f"Error exporting statement execution results: {e}",
            },
            namespace=DATA_DOC_NAMESPACE,
            room=socket_id,
            broadcast=True,
        )
