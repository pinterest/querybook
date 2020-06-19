from typing import Dict

from flask import (
    abort,
    Response,
)
from flask_login import current_user
import requests

from app.flask_app import socketio
from app.datasource import register, api_assert, RequestException
from app.db import DBSession
from app.auth.permission import (
    verify_environment_permission,
    verify_query_execution_permission,
    verify_query_engine_permission,
)
from clients.s3_client import FileDoesNotExist
from lib.export.all_exporters import ALL_EXPORTERS, get_exporter
from lib.result_store import GenericReader
from lib.query_analysis.templating import (
    render_templated_query,
    get_templated_variables_in_string,
    QueryTemplatingError,
)
from lib.form import validate_form
from const.query_execution import QueryExecutionStatus
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE
from logic import query_execution as logic
from logic import datadoc as datadoc_logic
from logic.datadoc_permission import user_can_read
from tasks.run_query import run_query_task


@register("/query_execution/", methods=["POST"])
def create_query_execution(query, engine_id, data_cell_id=None, originator=None):
    with DBSession() as session:
        verify_query_engine_permission(engine_id, session=session)

        uid = current_user.id
        query_execution = logic.create_query_execution(
            query=query, engine_id=engine_id, uid=uid, session=session
        )

        data_doc = None
        if data_cell_id:
            datadoc_logic.append_query_executions_to_data_cell(
                data_cell_id, [query_execution.id], session=session
            )
            data_cell = datadoc_logic.get_data_cell_by_id(data_cell_id, session=session)
            data_doc = data_cell.doc

        try:
            run_query_task.apply_async(
                args=[query_execution.id,]
            )
            query_execution_dict = query_execution.to_dict()

            if data_doc:
                socketio.emit(
                    "data_doc_query_execution",
                    (originator, query_execution_dict, data_cell_id,),
                    namespace="/datadoc",
                    room=data_doc.id,
                    broadcast=True,
                )

            return query_execution_dict
        except Exception as e:
            # We might encounter ConnectionError caused by
            # Redis connection failing
            logic.create_query_execution_error(
                query_execution.id,
                error_type=None,
                error_message_extracted="Encountered Error connecting to Redis",
                error_message=str(e),
                commit=False,
                session=session,
            )
            query_execution.status = QueryExecutionStatus.ERROR
            session.commit()
            raise e


@register("/query_execution/<int:query_execution_id>/", methods=["GET"])
def get_query_execution(query_execution_id):
    execution = logic.get_query_execution_by_id(query_execution_id)
    verify_query_engine_permission(execution.engine_id)
    execution_dict = execution.to_dict(True) if execution is not None else None
    return execution_dict


@register("/batch/query_execution/", methods=["POST"])
def batch_get_query_execution(ids):
    with DBSession() as session:
        executions = logic.get_query_execution_by_ids(ids, session=session)
        for execution in executions:
            verify_query_engine_permission(execution.engine_id, session=session)
        return [
            execution.to_dict(True) if execution is not None else None
            for execution in executions
        ]


@register("/query_execution/<int:query_execution_id>/", methods=["DELETE"])
def cancel_query_execution(query_execution_id):
    with DBSession() as session:
        execution = logic.get_query_execution_by_id(query_execution_id, session=session)
        verify_query_engine_permission(execution.engine_id, session=session)

        execution_dict = execution.to_dict(True) if execution is not None else None

        requestor = current_user.id
        api_assert(
            requestor == execution_dict["uid"], "You can only cancel your own queries"
        )

        if execution_dict and "task_id" in execution_dict:
            task = run_query_task.AsyncResult(execution_dict["task_id"])
            if task is not None:
                task.abort()


@register("/query_execution/search/", methods=["GET"])
def search_query_execution(
    environment_id, filters={}, orderBy=None, limit=100, offset=0
):
    verify_environment_permission([environment_id])
    with DBSession() as session:
        query_executions = logic.search_query_execution(
            environment_id=environment_id,
            filters=filters,
            orderBy=orderBy,
            limit=limit,
            offset=offset,
            session=session,
        )

        result = [
            query_execution.to_dict(with_statement=False)
            for query_execution in query_executions
        ]

        return result


@register("/query_execution/<int:query_execution_id>/datadoc_cell_info/")
def get_datadoc_ids_by_query_execution(query_execution_id):
    with DBSession() as session:
        verify_query_execution_permission(query_execution_id, session=session)
        pair_id = next(
            iter(
                logic.get_datadoc_id_from_query_execution_id(
                    query_execution_id, session=session
                )
            ),
            None,
        )
        if pair_id is None:
            return None

        doc_id, cell_id = pair_id
        cell_title = None

        if user_can_read(doc_id, current_user.id, session=session):
            cell_info = datadoc_logic.get_data_cell_by_id(cell_id, session=session)
            if cell_info:
                cell_title = cell_info.meta.get("title")

        return {"doc_id": doc_id, "cell_id": cell_id, "cell_title": cell_title}


@register(
    "/query_execution/<int:query_execution_id>/error/",
    methods=["GET"],
    require_auth=True,
)
def get_query_execution_error(query_execution_id):
    with DBSession() as session:
        verify_query_execution_permission(query_execution_id, session=session)
        return logic.get_query_execution_error(query_execution_id, session=session)


@register(
    "/statement_execution/<int:statement_execution_id>/result/download/",
    methods=["GET"],
    require_auth=True,
    custom_response=True,
)
def download_statement_execution_result(statement_execution_id):
    with DBSession() as session:
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id, session=session
        )
        api_assert(
            statement_execution is not None, message="Invalid statement execution"
        )
        verify_query_execution_permission(
            statement_execution.query_execution_id, session=session
        )

        reader = GenericReader(statement_execution.result_path)
        response = None
        if reader.has_download_url:
            # If the Reader can generate a download,
            # we proxy download the file
            download_url = reader.get_download_url()
            req = requests.get(download_url, stream=True)

            # 10 KB size
            response = Response(req.iter_content(chunk_size=10 * 1024))
        else:
            # We read the raw file and download it for the user
            reader.start()
            raw = reader.read_raw()
            response = Response(raw)
        response.headers["Content-Type"] = "text/plain"
        response.headers[
            "Content-Disposition"
        ] = 'attachment; filename="result_{}_{}.csv"'.format(
            statement_execution.query_execution_id, statement_execution_id
        )
        return response


@register(
    "/statement_execution/<int:statement_execution_id>/result/",
    methods=["GET"],
    require_auth=True,
)
def get_statement_execution_result(statement_execution_id):
    with DBSession() as session:
        try:
            statement_execution = logic.get_statement_execution_by_id(
                statement_execution_id, session=session
            )
            api_assert(
                statement_execution is not None, message="Invalid statement execution"
            )
            verify_query_execution_permission(
                statement_execution.query_execution_id, session=session
            )

            with GenericReader(statement_execution.result_path) as reader:
                result = reader.read_csv(number_of_lines=2001)
                return result
        except FileDoesNotExist as e:
            abort(RESOURCE_NOT_FOUND_STATUS_CODE, str(e))


@register(
    "/statement_execution/<int:statement_execution_id>/log/",
    methods=["GET"],
    require_auth=True,
)
def get_statement_execution_log(statement_execution_id):
    with DBSession() as session:
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id, session=session
        )
        api_assert(
            statement_execution is not None, message="Invalid statement execution"
        )
        verify_query_execution_permission(
            statement_execution.query_execution_id, session=session
        )

        log_path = statement_execution.log_path
        try:
            if log_path.startswith("stream"):
                logs = logic.get_statement_execution_stream_logs(statement_execution_id)
                return list(map(lambda log: log.log, logs))
            else:
                with DBSession() as session:
                    MAX_LOG_RETURN_LINES = 2000
                    result = ""

                    statement_execution = logic.get_statement_execution_by_id(
                        statement_execution_id, session=session
                    )
                    if statement_execution is not None and statement_execution.has_log:
                        with GenericReader(statement_execution.log_path) as reader:
                            result = reader.read_lines(
                                number_of_lines=MAX_LOG_RETURN_LINES
                            )
                            if len(result) == MAX_LOG_RETURN_LINES:
                                result += [
                                    "---------------------------------------------------------------------------",
                                    f"We are truncating results since it reached limit of {MAX_LOG_RETURN_LINES} lines.",
                                ]
                            return result
        except FileDoesNotExist as e:
            abort(RESOURCE_NOT_FOUND_STATUS_CODE, str(e))


@register(
    "/query_execution_notification/<int:user>/<int:query_id>/",
    methods=["GET"],
    require_auth=True,
)
def get_query_execution_notification(user, query_id):
    with DBSession() as session:
        verify_query_execution_permission(query_id, session=session)
        return logic.get_query_execution_notification(
            query_execution_id=query_id, user=user, session=session
        )


@register(
    "/query_execution_notification/<int:user>/<int:query_id>/",
    methods=["POST"],
    require_auth=True,
)
def create_query_execution_notification(
    user, query_id,
):
    with DBSession() as session:
        api_assert(
            current_user.id == user, "You can only create notification for yourself"
        )
        verify_query_execution_permission(query_id, session=session)

        return logic.create_query_execution_notification(
            query_execution_id=query_id, user=user, session=session
        )


@register(
    "/query_execution_notification/<int:user>/<int:query_id>/",
    methods=["DELETE"],
    require_auth=True,
)
def delete_query_execution_notification(
    user, query_id,
):
    with DBSession() as session:
        api_assert(
            current_user.id == user, "You can only delete notification for yourself"
        )
        verify_query_execution_permission(query_id, session=session)

        logic.delete_query_execution_notification(
            query_execution_id=query_id, user=user, session=session
        )


@register("/query_execution_exporter/", methods=["GET"])
def get_all_query_result_exporters():
    return ALL_EXPORTERS


@register(
    "/query_execution_exporter/auth/", methods=["GET"],
)
def export_statement_execution_acquire_auth(export_name):
    exporter = get_exporter(export_name)
    api_assert(exporter is not None, f"Invalid export name {export_name}")
    if not exporter.requires_auth:
        return None
    return exporter.acquire_auth(current_user.id)


@register(
    "/query_execution_exporter/statement_execution/<int:statement_execution_id>/",
    methods=["GET"],
    require_auth=True,
)
def export_statement_execution_result(
    statement_execution_id, export_name, exporter_params=None
):
    with DBSession() as session:
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id, session=session
        )
        api_assert(
            statement_execution is not None, message="Invalid statement execution"
        )
        verify_query_execution_permission(
            statement_execution.query_execution_id, session=session
        )

    exporter = get_exporter(export_name)
    api_assert(exporter is not None, f"Invalid export name {export_name}")

    if exporter_params:
        valid, reason = validate_form(exporter.export_form, exporter_params)
        api_assert(valid, "Invalid exporter params, reason: " + reason)

    return exporter.export(
        statement_execution_id, current_user.id, **(exporter_params or {})
    )


@register("/query_execution/templated_query/", methods=["POST"])
def get_templated_query(query: str, variables: Dict[str, str]):
    try:
        return render_templated_query(query, variables)
    except QueryTemplatingError as e:
        raise RequestException(e)


@register("/query_execution/templated_query_params/", methods=["POST"])
def get_templated_query_params(query: str):
    return list(get_templated_variables_in_string(query))
