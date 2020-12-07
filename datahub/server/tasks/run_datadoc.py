from app.db import DBSession
from app.flask_app import celery
from celery import chain
from const.data_doc import DataCellType
from const.query_execution import QueryExecutionStatus
from const.schedule import NotifyOn, TaskRunStatus
from env import SiteSettings
from lib.export.all_exporters import get_exporter
from lib.logger import get_logger
from lib.query_analysis.templating import render_templated_query
from logic import datadoc as datadoc_logic
from logic import query_execution as qe_logic
from logic.schedule import (
    create_task_run_record_for_celery_task,
    update_task_run_record,
)
from models.user import User
from tasks.run_query import run_query_task
from lib.notify.utils import notify_user

LOG = get_logger(__file__)
GENERIC_QUERY_FAILURE_MSG = "Execution did not finish successfully, workflow failed"


@celery.task(bind=True)
def run_datadoc(
    self,
    doc_id,
    user_id=None,
    # Notification related settings
    notify_with=None,
    notify_on=NotifyOn.ALL.value,
    # Exporting related settings
    exporter_cell_id=None,
    exporter_name=None,
    exporter_params={},
    *args,
    **kwargs,
):
    tasks_to_run = []
    record_id = None

    with DBSession() as session:
        data_doc = datadoc_logic.get_data_doc_by_id(doc_id, session=session)
        if not data_doc:
            return None

        runner_id = user_id if user_id is not None else data_doc.owner_uid
        query_cells = [
            cell for cell in data_doc.cells if cell.cell_type == DataCellType.query
        ]
        if exporter_cell_id is not None and not any(
            cell.id == exporter_cell_id for cell in query_cells
        ):
            raise Exception("Invalid cell id for exporting")

        # Preping chain jobs each unit is a [make_qe_task, run_query_task] combo
        for index, query_cell in enumerate(query_cells):
            query = render_templated_query(query_cell.context, data_doc.meta)
            make_query_execution_kwargs = {
                "query": query,
                "engine_id": query_cell.meta["engine"],
                "cell_id": query_cell.id,
                "uid": runner_id,
            }

            tasks_to_run.append(
                _make_query_execution_task.si(
                    prev_query_status=QueryExecutionStatus.DONE.value,
                    **make_query_execution_kwargs,
                )
                if index == 0
                else _make_query_execution_task.s(**make_query_execution_kwargs)
            )
            tasks_to_run.append(run_query_task.s())

        # Create db entry record
        record_id = create_task_run_record_for_celery_task(self, session=session)

    completion_task_kwargs = {
        "doc_id": doc_id,
        "user_id": user_id,
        "record_id": record_id,
        "notify_with": notify_with,
        "notify_on": notify_on,
        "exporter_name": exporter_name,
        "exporter_params": exporter_params,
        "exporter_cell_id": exporter_cell_id,
    }

    chain(*tasks_to_run).apply_async(
        link=on_datadoc_run_success.s(**completion_task_kwargs),
        link_error=on_datadoc_run_failure.s(**completion_task_kwargs),
    )


@celery.task(bind=True)
def _make_query_execution_task(
    self, prev_query_status, query, engine_id, cell_id, uid,
):
    if prev_query_status == QueryExecutionStatus.DONE.value:
        # TODO: add permission check here
        with DBSession() as session:
            query_execution_id = qe_logic.create_query_execution(
                query=query, engine_id=engine_id, uid=uid, session=session
            ).id
            datadoc_logic.append_query_executions_to_data_cell(
                cell_id, [query_execution_id], session=session
            )
            return query_execution_id
    else:
        raise Exception(GENERIC_QUERY_FAILURE_MSG)


@celery.task
def on_datadoc_run_success(
    last_query_status, **kwargs,
):
    is_success = last_query_status == QueryExecutionStatus.DONE.value
    error_msg = None if is_success else GENERIC_QUERY_FAILURE_MSG
    return on_datadoc_completion(is_success=is_success, error_msg=error_msg, **kwargs)


@celery.task
def on_datadoc_run_failure(
    request, exc, traceback, **kwargs,
):
    error_msg = "DataDoc failed to run. Task {0!r} raised error: {1!r}".format(
        request.id, exc
    )
    return on_datadoc_completion(is_success=False, error_msg=error_msg, **kwargs)


def on_datadoc_completion(
    doc_id,
    user_id,
    record_id,
    # Notification settings
    notify_with,
    notify_on,
    # Export settings
    exporter_cell_id,
    exporter_name,
    exporter_params,
    # Success/Failure handling
    is_success,
    error_msg=None,
):
    try:
        update_task_run_record(
            id=record_id,
            status=TaskRunStatus.SUCCESS if is_success else TaskRunStatus.FAILURE,
            error_message=error_msg,
        )

        # Export query results
        export_url = None
        if is_success and exporter_cell_id is not None:
            statement_execution_id = None
            with DBSession() as session:
                cell = datadoc_logic.get_data_cell_by_id(
                    exporter_cell_id, session=session
                )
                assert cell and len(cell.query_executions) > 0
                query_execution = cell.query_executions[0]
                statement_execution_id = query_execution.statement_executions[-1].id
            if statement_execution_id is not None:
                exporter = get_exporter(exporter_name)
                export_url = exporter.export(
                    statement_execution_id, user_id, **(exporter_params or {})
                )

        # Send user Notification
        should_notify = notify_on == NotifyOn.ALL.value or (
            (notify_on == NotifyOn.ON_SUCCESS.value and is_success)
            or (notify_on == NotifyOn.ON_FAILURE.value and not is_success)
        )
        if should_notify and notify_with is not None:
            with DBSession() as session:
                datadoc = datadoc_logic.get_data_doc_by_id(doc_id, session=session)
                doc_title = datadoc.title or "Untitled"
                env_name = datadoc.environment.name
                doc_url = f"{SiteSettings.PUBLIC_URL}/{env_name}/datadoc/{doc_id}/"
                user = User.get(id=user_id, session=session)

                notify_user(
                    user=user,
                    template_name="datadoc_completion_notification",
                    template_params=dict(
                        is_success=is_success,
                        doc_title=doc_title,
                        doc_url=doc_url,
                        doc_id=doc_id,
                        export_url=export_url,
                        error_msg=error_msg,
                    ),
                    notifier_name=notify_with,
                    session=session,
                )
    except Exception as e:
        is_success = False
        # error_msg = str(e)
        LOG.error(e, exc_info=True)

    return is_success
