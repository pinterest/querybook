from flask_socketio import join_room, leave_room, emit, rooms
from flask import request

from app.auth.permission import verify_query_engine_permission
from app.db import DBSession
from const.query_execution import QueryExecutionStatus, QUERY_EXECUTION_NAMESPACE
from lib.logger import get_logger
from logic import query_execution as qe_logic
from tasks import run_query as tasks
from .helper import register_socket

LOG = get_logger(__file__)


@register_socket("subscribe", namespace=QUERY_EXECUTION_NAMESPACE)
def on_join_room(query_execution_id):
    with DBSession() as session:
        execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        assert execution, "Invalid execution"
        verify_query_engine_permission(execution.engine_id, session=session)

        execution_dict = execution.to_dict(True) if execution is not None else None
        join_room(query_execution_id)

        if execution_dict and len(execution_dict.get("statement_executions", [])):
            statement_execution = execution_dict["statement_executions"][-1]
            # Format statement execution's logs
            if statement_execution["has_log"]:
                logs = qe_logic.get_statement_execution_stream_logs(
                    statement_execution["id"], from_end=True, session=session
                )
                statement_execution["log"] = [log.log for log in logs]

            # Getting task's running data
            if (
                "task_id" in execution_dict
                and execution_dict.get("status", None)
                == QueryExecutionStatus.RUNNING.value
            ):
                task = tasks.run_query_task.AsyncResult(execution_dict["task_id"])
                try:
                    if task is not None and task.info is not None:
                        progress = task.info
                        if str(statement_execution["id"]) in progress:
                            statement_execution["percent_complete"] = progress[
                                str(statement_execution["id"])
                            ].get("percent_complete")
                        execution_dict["total"] = progress.get("total", 0)
                except Exception as e:
                    LOG.info(e)

        emit(
            "query",
            execution_dict,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=query_execution_id,
        )


@register_socket("unsubscribe", namespace=QUERY_EXECUTION_NAMESPACE)
def on_leave_room(query_execution_id):
    leave_room(query_execution_id)


@register_socket("disconnect", namespace=QUERY_EXECUTION_NAMESPACE)
def disconnect():
    query_execution_ids = rooms(request.sid, namespace=QUERY_EXECUTION_NAMESPACE)
    for query_execution_id in query_execution_ids:
        leave_room(query_execution_id)
