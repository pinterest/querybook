from datetime import datetime

from sqlalchemy.orm import joinedload

from app.db import with_session
from app.flask_app import celery

from const.query_execution import QueryExecutionStatus, StatementExecutionStatus
from models.query_execution import (
    QueryExecution,
    StatementExecution,
    QueryExecutionNotification,
    QueryExecutionError,
    StatementExecutionStreamLog,
)
from models.datadoc import DataCellQueryExecution, DataDocDataCell
from models.admin import QueryEngine

CLEAN_UP_TIME_THRESHOLD = 20 * 60  # 20 mins


"""
    ----------------------------------------------------------------------------------------------------------
    QUERY EXECUTION
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_datadoc_id_from_query_execution_id(query_execution_id, session=None):
    return (
        session.query(DataDocDataCell.data_doc_id, DataDocDataCell.data_cell_id)
        .join(
            DataCellQueryExecution,
            DataDocDataCell.data_cell_id == DataCellQueryExecution.data_cell_id,
        )
        .join(QueryExecution)
        .filter(QueryExecution.id == query_execution_id)
        .all()
    )


@with_session
def search_query_execution(
    environment_id, filters, orderBy, limit, offset, session=None
):
    query = (
        session.query(QueryExecution)
        .join(QueryEngine)
        .filter(QueryEngine.environment_id == environment_id)
    )

    for filter_key, filter_val in filters.items():
        if filter_val is not None:
            if filter_key == "user":
                query = query.filter(QueryExecution.uid == filter_val)
            elif filter_key == "engine":
                query = query.filter(QueryExecution.engine_id == filter_val)
            elif filter_key == "status":
                query = query.filter(
                    QueryExecution.status == QueryExecutionStatus(filter_val)
                )
            elif filter_key == "running":
                query = query.filter(
                    QueryExecution.status.in_(
                        [
                            QueryExecutionStatus.INITIALIZED,
                            QueryExecutionStatus.RUNNING,
                            QueryExecutionStatus.DELIVERED,
                        ]
                    )
                )

    if orderBy == "created_at":
        query = query.order_by(QueryExecution.created_at.desc())
    query = query.offset(offset).limit(limit)

    return query.all()


@with_session
def create_query_execution(
    query,
    engine_id,
    uid,
    task_id=None,
    status=QueryExecutionStatus.INITIALIZED,
    commit=True,
    session=None,
):
    query_execution = QueryExecution(
        query=query, engine_id=engine_id, uid=uid, task_id=task_id, status=status
    )
    session.add(query_execution)
    if commit:
        session.commit()
    else:
        session.flush()

    query_execution.id
    return query_execution


@with_session
def update_query_execution(
    query_execution_id,
    task_id=None,
    status=None,
    completed_at=None,
    commit=True,
    session=None,
):
    query_execution = get_query_execution_by_id(query_execution_id, session=session)

    if not query_execution:
        return

    if status is not None:
        query_execution.status = status

    if completed_at is not None:
        query_execution.completed_at = completed_at

    if task_id is not None:
        query_execution.task_id = task_id

    if commit:
        session.commit()
    else:
        session.flush()

    query_execution.id
    return query_execution


@with_session
def get_query_execution_by_id(id, session=None):
    return session.query(QueryExecution).get(id)


@with_session
def get_query_execution_by_ids(ids, session=None):
    return session.query(QueryExecution).filter(QueryExecution.id.in_(ids)).all()


"""
    ----------------------------------------------------------------------------------------------------------
    STATEMENT EXECUTION
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_statement_execution(
    query_execution_id,
    statement_range_start,
    statement_range_end,
    status=0,
    commit=True,
    session=None,
):
    statement_execution = StatementExecution(
        query_execution_id=query_execution_id,
        statement_range_start=statement_range_start,
        statement_range_end=statement_range_end,
        status=status,
    )
    session.add(statement_execution)

    if commit:
        session.commit()
        statement_execution.id
    else:
        session.flush()
    return statement_execution


@with_session
def update_statement_execution(
    statement_id,
    status=None,
    meta_info=None,
    completed_at=None,
    result_row_count=None,
    result_path=None,
    has_log=None,
    log_path=None,
    commit=True,
    session=None,
):
    statement_execution = get_statement_execution_by_id(statement_id, session=session)

    if not statement_execution:
        return

    if status is not None:
        statement_execution.status = status

    if completed_at is not None:
        statement_execution.completed_at = completed_at

    if meta_info is not None:
        statement_execution.meta_info = meta_info

    if result_row_count is not None:
        statement_execution.result_row_count = result_row_count

    if result_path is not None:
        statement_execution.result_path = result_path

    if has_log is not None:
        statement_execution.has_log = has_log

    if log_path is not None:
        statement_execution.log_path = log_path

    if commit:
        session.commit()
        statement_execution.id

    return statement_execution


@with_session
def get_statement_execution_by_id(id, with_query_execution=False, session=None):
    query = session.query(StatementExecution)

    if with_query_execution:
        query = query.options(joinedload("query_execution"))

    return query.get(id)


"""
    ----------------------------------------------------------------------------------------------------------
    QUERY EXECUTION NOTIFICATION
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_query_execution_notification(query_execution_id, user, session=None):
    return (
        session.query(QueryExecutionNotification)
        .filter(QueryExecutionNotification.query_execution_id == query_execution_id)
        .filter(QueryExecutionNotification.user == user)
        .first()
    )


@with_session
def create_query_execution_notification(query_execution_id, user, session=None):
    notification = QueryExecutionNotification(
        query_execution_id=query_execution_id, user=user,
    )
    session.add(notification)
    session.commit()

    notification.id

    return notification


@with_session
def delete_query_execution_notification(
    query_execution_id, user, commit=True, session=None
):
    session.query(QueryExecutionNotification).filter(
        QueryExecutionNotification.query_execution_id == query_execution_id
    ).filter(QueryExecutionNotification.user == user).delete()

    if commit:
        session.commit()


"""
    ----------------------------------------------------------------------------------------------------------
    STATEMENT EXECUTION LOG
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_statement_execution_stream_log(
    statement_execution_id, log, commit=True, session=None  # String
):
    stream_log = StatementExecutionStreamLog(
        statement_execution_id=statement_execution_id, log=log
    )

    session.add(stream_log)

    if commit:
        session.commit()
    else:
        session.flush()
    stream_log.id

    return stream_log


@with_session
def update_statement_execution_stream_log(id, log, commit=True, session=None):  # String
    stream_log = get_statement_execution_stream_log_by_id(id, session=session)
    if not stream_log:
        return

    stream_log.log = log

    if commit:
        session.commit()
    else:
        session.flush()

    stream_log.id
    return stream_log


@with_session
def get_statement_execution_stream_log_by_id(id, session=None):
    return session.query(StatementExecutionStreamLog).get(id)


@with_session
def get_statement_execution_stream_logs(
    statement_execution_id,
    limit=100,
    offset=0,
    from_end=False,  # This gets the stream logs from the end
    session=None,
):
    query = session.query(StatementExecutionStreamLog).filter(
        StatementExecutionStreamLog.statement_execution_id == statement_execution_id
    )

    if from_end:
        query = query.order_by(StatementExecutionStreamLog.id.desc())
    else:
        query = query.order_by(StatementExecutionStreamLog.id)

    query = query.limit(limit).offset(offset)
    rows = query.all()

    if from_end:
        return rows[::-1]
    return rows


@with_session
def delete_statement_execution_stream_log(
    statement_execution_id, commit=True, session=None
):
    session.query(StatementExecutionStreamLog).filter(
        StatementExecutionStreamLog.statement_execution_id == statement_execution_id
    ).delete()

    if commit:
        session.commit()


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY EXECUTION ERROR
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_query_execution_error(
    query_execution_id,
    error_type=None,
    error_message_extracted=None,
    error_message=None,
    commit=True,
    session=None,
):
    error = QueryExecutionError(
        query_execution_id=query_execution_id,
        error_type=error_type,
        error_message_extracted=error_message_extracted,
        error_message=error_message,
    )

    session.add(error)

    if commit:
        session.commit()
        error.id

    return error


@with_session
def get_query_execution_error(query_execution_id, session=None):
    return (
        session.query(QueryExecutionError)
        .filter(QueryExecutionError.query_execution_id == query_execution_id)
        .first()
    )


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY EXECUTION CLEAN UP
    ---------------------------------------------------------------------------------------------------------
"""


def is_task_active(task_id, active_celery_task_ids):
    if not task_id:
        return False

    return task_id in active_celery_task_ids


@with_session
def get_active_query_executions(session=None):
    return (
        session.query(QueryExecution)
        .filter(
            QueryExecution.status.in_(
                (
                    QueryExecutionStatus.INITIALIZED,
                    QueryExecutionStatus.DELIVERED,
                    QueryExecutionStatus.RUNNING,
                )
            )
        )
        .all()
    )


def get_active_celery_query_executions():
    def get_task_id_from_worker_tasks(tasks):
        return map(lambda task: task.get("id", ""), tasks)

    i = celery.control.inspect()
    active_tasks = i.active() or {}
    reserved_tasks = i.reserved() or {}

    task_ids = set()
    for task_type in [active_tasks, reserved_tasks]:
        for worker_tasks in task_type.values():
            for task_id in get_task_id_from_worker_tasks(worker_tasks):
                task_ids.add(task_id)
    return task_ids


@with_session
def clean_up_query_execution(dry_run=False, session=None):
    now = datetime.now()
    should_commit = False

    active_query_executions = get_active_query_executions(session=session)
    active_celery_task_ids = get_active_celery_query_executions()

    for query_execution in active_query_executions:
        # We skip looking at query executions that are too young
        time_passed_seconds = (now - query_execution.created_at).total_seconds()
        if time_passed_seconds < CLEAN_UP_TIME_THRESHOLD:
            continue

        should_clean_up = not is_task_active(
            query_execution.task_id, active_celery_task_ids
        )

        if should_clean_up:
            should_commit = True
            query_execution.status = QueryExecutionStatus.ERROR

            error_message = (
                "This execution was cancelled while in in-flight due to a necessary server restart."
                + "Please click on Run to issue a new one."
            )
            create_query_execution_error(
                query_execution.id,
                error_type=None,
                error_message_extracted=error_message,
                error_message=error_message,
                commit=False,
                session=session,
            )
            print("Updating query: {}".format(query_execution.id))

            statement_executions = query_execution.statement_executions
            for statement_execution in statement_executions:
                if (
                    statement_execution.status.value
                    < StatementExecutionStatus.DONE.value
                ):
                    statement_execution.status = StatementExecutionStatus.ERROR
                    print("Updating statement: {}".format(statement_execution.id))
    if should_commit and not dry_run:
        session.commit()
