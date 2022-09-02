from celery import chain

from app.db import DBSession
from app.flask_app import celery

from const.query_execution import QueryExecutionStatus, QueryExecutionType
from const.schedule import NotifyOn, TaskRunStatus

from lib.logger import get_logger
from lib.query_analysis.templating import render_templated_query
from lib.scheduled_datadoc.export import export_datadoc
from lib.scheduled_datadoc.legacy import convert_if_legacy_datadoc_schedule
from lib.scheduled_datadoc.notification import notifiy_on_datadoc_complete

from logic import datadoc as datadoc_logic
from logic import query_execution as qe_logic
from logic.schedule import (
    create_task_run_record_for_celery_task,
    update_task_run_record,
)
from tasks.run_query import run_query_task

LOG = get_logger(__file__)
GENERIC_QUERY_FAILURE_MSG = "Execution did not finish successfully, workflow failed"


@celery.task(bind=True)
def run_datadoc(self, *args, **kwargs):
    """
    This function wraps run_datadoc_with_config to convert
    legacy schedule config to current
    """
    run_datadoc_with_config(self, *args, **convert_if_legacy_datadoc_schedule(kwargs))


def run_datadoc_with_config(
    self,
    doc_id,
    user_id=None,
    execution_type=QueryExecutionType.SCHEDULED.value,
    # Notification related settings
    notify_with=None,
    notify_on=NotifyOn.ALL.value,
    # Exporting related settings
    exports=[],
    *args,
    **kwargs,
):
    tasks_to_run = []
    record_id = None
    with DBSession() as session:
        data_doc = datadoc_logic.get_data_doc_by_id(doc_id, session=session)
        if not data_doc or data_doc.archived:
            return

        runner_id = user_id if user_id is not None else data_doc.owner_uid
        query_cells = data_doc.get_query_cells()

        # Preping chain jobs each unit is a [make_qe_task, run_query_task] combo
        for index, query_cell in enumerate(query_cells):
            engine_id = query_cell.meta["engine"]
            query = render_templated_query(query_cell.context, data_doc.meta, engine_id)

            start_query_execution_kwargs = {
                "cell_id": query_cell.id,
                "query_execution_params": {
                    "query": query,
                    "engine_id": engine_id,
                    "uid": runner_id,
                },
            }
            tasks_to_run.append(
                _start_query_execution_task.si(
                    **start_query_execution_kwargs,
                    previous_query_status=QueryExecutionStatus.DONE.value,
                )
                if index == 0
                else _start_query_execution_task.s(**start_query_execution_kwargs)
            )

            tasks_to_run.append(run_query_task.s(execution_type=execution_type))

        # Create db entry record
        record_id = create_task_run_record_for_celery_task(self, session=session)

    completion_params = {
        "doc_id": doc_id,
        "user_id": user_id,
        "record_id": record_id,
        "notify_with": notify_with,
        "notify_on": notify_on,
        "exports": exports,
    }

    chain(*tasks_to_run).apply_async(
        link=on_datadoc_run_success.s(
            completion_params=completion_params,
        ),
        link_error=on_datadoc_run_failure.s(completion_params=completion_params),
    )


@celery.task(bind=True)
def _start_query_execution_task(
    self,
    previous_query_status,
    cell_id,
    query_execution_params,
):
    if previous_query_status != QueryExecutionStatus.DONE.value:
        raise Exception(GENERIC_QUERY_FAILURE_MSG)

    with DBSession() as session:
        query_execution_id = qe_logic.create_query_execution(
            **query_execution_params, session=session
        ).id
        datadoc_logic.append_query_executions_to_data_cell(
            cell_id, [query_execution_id], session=session
        )
        return query_execution_id


@celery.task
def on_datadoc_run_success(
    last_query_status,
    completion_params,
    **kwargs,
):
    is_success = last_query_status == QueryExecutionStatus.DONE.value
    error_msg = None if is_success else GENERIC_QUERY_FAILURE_MSG

    return on_datadoc_completion(
        is_success=is_success, error_msg=error_msg, **completion_params
    )


@celery.task
def on_datadoc_run_failure(
    request,
    exc,
    traceback,
    completion_params,
    **kwargs,
):
    error_msg = "DataDoc failed to run. Task {0!r} raised error: {1!r}".format(
        request.id, exc
    )
    return on_datadoc_completion(
        is_success=False, error_msg=error_msg, **completion_params
    )


def on_datadoc_completion(
    doc_id,
    user_id,
    record_id,
    # Notification settings
    notify_with,
    notify_on,
    # Export settings
    exports,
    # Success/Failure handling
    is_success,
    error_msg=None,
):
    try:
        export_urls = []
        if is_success:
            export_urls = export_datadoc(doc_id, user_id, exports)

        notifiy_on_datadoc_complete(
            doc_id, user_id, is_success, notify_with, notify_on, error_msg, export_urls
        )
    except Exception as e:
        is_success = False
        error_msg = str(e)
        LOG.error(e, exc_info=True)
    finally:
        update_task_run_record(
            id=record_id,
            status=TaskRunStatus.SUCCESS if is_success else TaskRunStatus.FAILURE,
            error_message=error_msg,
        )

    return is_success
