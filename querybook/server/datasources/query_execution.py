from datetime import datetime

from flask import abort, Response, redirect, request
from flask_login import current_user

from app.flask_app import socketio
from app.datasource import register, api_assert, RequestException
from app.db import DBSession
from app.auth.permission import (
    verify_environment_permission,
    verify_query_execution_permission,
    verify_query_engine_permission,
)
from clients.common import FileDoesNotExist
from lib.export.all_exporters import ALL_EXPORTERS, get_exporter
from lib.result_store import GenericReader
from lib.query_analysis.templating import (
    QueryTemplatingError,
    get_templated_variables_in_string,
    render_templated_query,
)
from lib.form import validate_form
from lib.data_doc.meta import var_config_to_var_dict
from lib.data_doc.doc_types import DataDocMetaVarConfig
from const.datasources import (
    RESOURCE_NOT_FOUND_STATUS_CODE,
    INVALID_SEMANTIC_STATUS_CODE,
)
from const.query_execution import (
    QueryExecutionExportStatus,
    QueryExecutionStatus,
    QUERY_EXECUTION_NAMESPACE,
    StatementExecutionStatus,
)
from logic import (
    query_execution as logic,
    datadoc as datadoc_logic,
    user as user_logic,
    admin as admin_logic,
)
from logic.datadoc_permission import user_can_read
from logic.query_execution_permission import (
    get_default_user_environment_by_execution_id,
)
from lib.config import get_config_value
from lib.query_analysis.validation.all_validators import get_validator_by_name
from lib.query_analysis.transpilation.all_transpilers import (
    ALL_TRANSPILERS,
    get_transpiler_by_name,
)
from tasks.export_query_execution import export_query_execution_task
from tasks.run_query import run_query_task
from app.auth.permission import verify_query_execution_owner
from models.query_execution import QueryExecutionViewer
from models.access_request import AccessRequest
from app.db import with_session
from env import QuerybookSettings
from lib.notify.utils import notify_user

QUERY_RESULT_LIMIT_CONFIG = get_config_value("query_result_limit")


@register("/query_execution/", methods=["POST"])
def create_query_execution(
    query, engine_id, metadata=None, data_cell_id=None, originator=None
):
    with DBSession() as session:
        verify_query_engine_permission(engine_id, session=session)

        uid = current_user.id
        query_execution = logic.create_query_execution(
            query=query, engine_id=engine_id, uid=uid, session=session
        )

        metadata = metadata or {}
        used_api_token = request.headers.get("api-access-token") is not None
        if used_api_token:
            metadata["used_api_token"] = used_api_token
        if metadata:
            logic.create_query_execution_metadata(
                query_execution.id, metadata, session=session
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
                args=[
                    query_execution.id,
                ]
            )
            query_execution_dict = query_execution.to_dict()

            if data_doc:
                socketio.emit(
                    "data_doc_query_execution",
                    (
                        originator,
                        query_execution_dict,
                        data_cell_id,
                    ),
                    namespace="/datadoc",
                    room=data_doc.id,
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
    verify_query_execution_permission(query_execution_id)
    execution = logic.get_query_execution_by_id(query_execution_id)
    execution_dict = execution.to_dict(True) if execution is not None else None
    return execution_dict


@register("/query_execution/<int:query_execution_id>/", methods=["DELETE"])
def cancel_query_execution(query_execution_id):
    execution = logic.get_query_execution_by_id(query_execution_id)
    api_assert(
        execution is not None, f"Invalid query execution id {query_execution_id}"
    )

    # Check if user has access to execution
    verify_query_engine_permission(execution.engine_id)

    # Check if the user is indeed the one who issued it
    api_assert(current_user.id == execution.uid, "You can only cancel your own queries")

    # Check if the execution is "RUNNING"
    api_assert(
        execution.status
        in [
            QueryExecutionStatus.INITIALIZED,
            QueryExecutionStatus.RUNNING,
            QueryExecutionStatus.DELIVERED,
        ],
        "Execution is already completed",
    )

    def cancel_query_and_notify():
        statement_executions = execution.statement_executions
        if len(statement_executions) > 0:
            logic.update_statement_execution(
                statement_executions[-1].id,
                status=StatementExecutionStatus.CANCEL,
                completed_at=datetime.utcnow(),
            )

        execution_dict = logic.update_query_execution(
            query_execution_id,
            status=QueryExecutionStatus.CANCEL,
            completed_at=datetime.utcnow(),
        ).to_dict()

        socketio.emit(
            "query_cancel",
            execution_dict,
            namespace=QUERY_EXECUTION_NAMESPACE,
            room=query_execution_id,
        )

    if not execution.task_id:
        cancel_query_and_notify()
        return

    task = run_query_task.AsyncResult(execution.task_id)

    if task.state in (
        "PENDING",  # Task is unknown or haven't delivered to worker yet
        "RECEIVED",  # Rare case where task is received but not yet start
        "RETRY",  # Very unlikely case, because query normally do not retry
    ):
        task.revoke(terminate=True)  # last attempt to cancel it
        cancel_query_and_notify()
    elif task.state == "ABORTED":
        # In this case, the task is already aborted, but the status is running
        # We will update the DB status and do nothing about the task itself
        cancel_query_and_notify()
    else:  # RUNNING, celery state is STARTED
        # Do not update status and let the worker handle it
        task.abort()


@register("/query_execution/search/", methods=["GET"])
def search_query_execution(
    environment_id, filters={}, orderBy=None, limit=100, offset=0
):
    verify_environment_permission([environment_id])
    with DBSession() as session:
        if "user" in filters:
            api_assert(
                current_user.id == filters["user"],
                "You can only search your own queries",
            )
        else:
            filters["user"] = current_user.id
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


@register("/query_execution/<int:query_execution_id>/metadata/", methods=["GET"])
def get_query_execution_metadata(query_execution_id):
    verify_query_execution_permission(query_execution_id)
    execution_metadata = logic.get_query_execution_metadata_by_execution_id(
        query_execution_id
    )
    return execution_metadata.to_dict() if execution_metadata is not None else None


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

        download_file_name = f"result_{statement_execution.query_execution_id}_{statement_execution_id}.csv"

        reader = GenericReader(statement_execution.result_path)
        response = None
        if reader.has_download_url:
            # If the Reader can generate a download,
            # we let user download the file by redirection
            download_url = reader.get_download_url(custom_name=download_file_name)
            response = redirect(download_url)
        else:
            # We read the raw file and download it for the user
            reader.start()
            raw = reader.read_raw()
            response = Response(raw)
            response.headers["Content-Type"] = "text/csv"
            response.headers[
                "Content-Disposition"
            ] = f'attachment; filename="{download_file_name}"'
        return response


@register(
    "/statement_execution/<int:statement_execution_id>/result/",
    methods=["GET"],
    require_auth=True,
)
def get_statement_execution_result(statement_execution_id, limit=None):
    # TODO: make this customizable
    limit = (
        QUERY_RESULT_LIMIT_CONFIG["default_query_result_size"]
        if limit is None
        else limit
    )
    api_assert(
        limit <= QUERY_RESULT_LIMIT_CONFIG["query_result_size_options"][-1],
        message="Too many rows requested",
    )

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
                result = reader.read_csv(number_of_lines=limit + 1)  # 1 row for column
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
    "/query_execution_notification/<int:query_id>/",
    methods=["GET"],
    require_auth=True,
)
def get_query_execution_notification(query_id):
    with DBSession() as session:
        verify_query_execution_permission(query_id, session=session)
        return logic.get_query_execution_notification(
            query_execution_id=query_id, uid=current_user.id, session=session
        )


@register(
    "/query_execution_notification/<int:query_id>/",
    methods=["POST"],
    require_auth=True,
)
def create_query_execution_notification(
    query_id,
):
    with DBSession() as session:
        verify_query_execution_permission(query_id, session=session)

        return logic.create_query_execution_notification(
            query_execution_id=query_id, uid=current_user.id, session=session
        )


@register(
    "/query_execution_notification/<int:query_id>/",
    methods=["DELETE"],
    require_auth=True,
)
def delete_query_execution_notification(
    query_id,
):
    with DBSession() as session:
        verify_query_execution_permission(query_id, session=session)
        logic.delete_query_execution_notification(
            query_execution_id=query_id, uid=current_user.id, session=session
        )


@register("/query_execution_exporter/", methods=["GET"])
def get_all_query_result_exporters():
    return ALL_EXPORTERS


@register(
    "/query_execution_exporter/auth/",
    methods=["GET"],
)
def export_statement_execution_acquire_auth(exporter_name):
    exporter = get_exporter(exporter_name)
    api_assert(exporter is not None, f"Invalid exporter name {exporter_name}")
    if not exporter.requires_auth:
        return None
    return exporter.acquire_auth(current_user.id)


@register(
    "/query_execution_exporter/statement_execution/<int:statement_execution_id>/",
    methods=["GET"],
    require_auth=True,
)
def export_statement_execution_result(
    statement_execution_id, exporter_name, exporter_params=None
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

    exporter = get_exporter(exporter_name)
    api_assert(exporter is not None, f"Invalid export name {exporter_name}")

    if exporter_params:
        valid, reason = validate_form(exporter.export_form, exporter_params)
        api_assert(valid, "Invalid exporter params, reason: " + reason)

    task = export_query_execution_task.apply_async(
        args=[
            exporter.exporter_name,
            statement_execution_id,
            current_user.id,
            exporter_params or {},
        ],
    )

    return task.task_id


@register(
    "/query_execution_exporter/task/<task_id>/poll/",
    methods=["GET"],
    require_auth=True,
)
def poll_export_statement_execution_result(task_id):
    task = export_query_execution_task.AsyncResult(task_id)
    if task is not None:
        if task.ready():
            if task.failed():
                return {
                    "task_id": task_id,
                    "status": QueryExecutionExportStatus.ERROR.value,
                    "message": str(task.result),
                }

            if task.info is not None:
                return {
                    "task_id": task_id,
                    "status": QueryExecutionExportStatus.DONE.value,
                    "result": task.result,
                }

            return {
                "task_id": task_id,
                "status": QueryExecutionExportStatus.RUNNING.value,
            }

    return None


@register("/query_execution/templated_query/", methods=["POST"])
def get_templated_query(
    query: str, var_config: list[DataDocMetaVarConfig], engine_id: int
):
    try:
        return render_templated_query(
            query, var_config_to_var_dict(var_config), engine_id
        )
    except QueryTemplatingError as e:
        raise RequestException(e, status_code=INVALID_SEMANTIC_STATUS_CODE)


@register("/query_execution/templated_query_params/", methods=["POST"])
def get_templated_query_params(query: str):
    return list(get_templated_variables_in_string(query))


@register("/query_execution/<int:execution_id>/viewer/", methods=["POST"])
def add_query_execution_viewer(execution_id, uid):
    verify_query_execution_owner(execution_id)
    with DBSession() as session:
        viewer = QueryExecutionViewer.create(
            {
                "query_execution_id": execution_id,
                "uid": uid,
                "created_by": current_user.id,
            },
            commit=False,
            session=session,
        )
        access_request = AccessRequest.get(
            session=session, query_execution_id=execution_id, uid=uid
        )
        if access_request:
            AccessRequest.delete(id=access_request.id, session=session, commit=False)
        send_query_execution_invitation_notification(
            execution_id=execution_id, uid=uid, session=session
        )
        session.commit()
    return viewer.to_dict()


@register("/query_execution_viewer/<int:id>/", methods=["DELETE"])
def delete_query_execution_viewer(id):
    return QueryExecutionViewer.delete(id)


@register("/query_execution/<int:execution_id>/viewer/", methods=["GET"])
def get_query_execution_viewers(execution_id):
    verify_query_execution_owner(execution_id)
    return QueryExecutionViewer.get_all(query_execution_id=execution_id)


@register("/query_execution/<int:execution_id>/access_request/", methods=["GET"])
def get_query_execution_access_requests(execution_id):
    verify_query_execution_owner(execution_id)
    return AccessRequest.get_all(query_execution_id=execution_id)


@register("/query_execution/<int:execution_id>/access_request/", methods=["POST"])
def add_query_execution_access_request(execution_id):
    uid = current_user.id
    access_request = AccessRequest.get(query_execution_id=execution_id, uid=uid)
    if not access_request:
        access_request = AccessRequest.create(
            {"query_execution_id": execution_id, "uid": uid}
        )
    send_query_execution_access_request_notification(execution_id=execution_id, uid=uid)
    return access_request


@register("/query_execution/<int:execution_id>/access_request/", methods=["DELETE"])
def delete_query_execution_access_request(execution_id, uid):
    verify_query_execution_owner(execution_id)
    access_request = AccessRequest.get(query_execution_id=execution_id, uid=uid)
    if access_request:
        AccessRequest.delete(id=access_request.id)


@with_session
def send_query_execution_access_request_notification(execution_id, uid, session=None):
    requestor = user_logic.get_user_by_id(uid, session=session)
    query_execution = logic.get_query_execution_by_id(execution_id, session=session)
    environment = get_default_user_environment_by_execution_id(
        execution_id=execution_id, uid=uid, session=session
    )
    execution_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/query_execution/{execution_id}/"

    owner = user_logic.get_user_by_id(query_execution.uid, session=session)
    requestor_username = requestor.get_name()
    notify_user(
        user=owner,
        template_name="query_execution_access_request",
        template_params=dict(
            username=requestor_username,
            execution_id=execution_id,
            execution_url=execution_url,
        ),
    )


@with_session
def send_query_execution_invitation_notification(execution_id, uid, session=None):
    inviting_user = user_logic.get_user_by_id(current_user.id, session=session)
    invited_user = user_logic.get_user_by_id(uid, session=session)
    environment = get_default_user_environment_by_execution_id(
        execution_id=execution_id, uid=uid, session=session
    )
    execution_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/query_execution/{execution_id}/"

    notify_user(
        user=invited_user,
        template_name="query_execution_invitation",
        template_params=dict(
            inviting_username=inviting_user.get_name(),
            execution_id=execution_id,
            execution_url=execution_url,
        ),
        session=session,
    )


@register("/query/validate/", methods=["POST"])
def perform_query_syntax_check(
    query: str, engine_id: int, var_config: list[DataDocMetaVarConfig]
):
    verify_query_engine_permission(engine_id)

    engine = admin_logic.get_query_engine_by_id(engine_id)
    validator_name = engine.feature_params.get("validator", None)
    api_assert(validator_name is not None, "This engine has no validator configured")

    validator = get_validator_by_name(validator_name)

    api_assert(
        engine.language in validator.languages(),
        "The query engine language does not equal to validator language",
    )

    return validator.validate_with_templated_vars(
        query, current_user.id, engine_id, var_config_to_var_dict(var_config)
    )


@register("/query/transpile/", methods=["GET"])
def get_all_transpilers():
    return ALL_TRANSPILERS


@register("/query/transpile/<transpiler_name>/", methods=["POST"])
def transpile_query(
    transpiler_name: str, query: str, from_language: str, to_language: str
):
    transpiler = get_transpiler_by_name(transpiler_name)
    return transpiler.transpile(query, from_language, to_language)
