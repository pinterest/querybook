from app.flask_app import celery
from datetime import datetime, timedelta

from app.db import DBSession, with_session
from const.query_execution import QueryExecutionStatus
from logic.query_execution import update_es_query_execution_by_id
from models.schedule import TaskRunRecord
from models.query_execution import QueryExecution
from models.impression import Impression
from models.datadoc import DataDoc
from models.event_log import EventLog
from logic.schedule import with_task_logging


@celery.task(bind=True)
@with_task_logging()
def run_all_db_clean_up_jobs(
    self,
    days_to_keep_task_record=30,
    days_to_keep_query_exec_done=90,
    days_to_keep_query_exec_else=30,
    days_to_keep_impression=30,
    days_to_keep_archived_data_doc=60,
    days_to_keep_event_logs=7,
):
    with DBSession() as session:
        if days_to_keep_task_record != -1:
            clean_up_task_run_record(
                days_to_keep=days_to_keep_task_record, session=session
            )
        if days_to_keep_query_exec_done != -1 and days_to_keep_query_exec_else != -1:
            clean_up_query_execution(
                days_to_keep_done=days_to_keep_query_exec_done,
                days_to_keep_else=days_to_keep_query_exec_else,
                session=session,
            )
        if days_to_keep_impression != -1:
            clean_up_impression(days_to_keep=days_to_keep_impression, session=session)
        if days_to_keep_archived_data_doc != -1:
            clean_up_archived_data_doc(
                days_to_keep=days_to_keep_archived_data_doc, session=session
            )
        if days_to_keep_event_logs != -1:
            clean_up_event_logs(days_to_keep=days_to_keep_event_logs, session=session)


@with_session
def clean_up_task_run_record(days_to_keep=30, session=None):
    last_day = datetime.now() - timedelta(days_to_keep)

    session.query(TaskRunRecord).filter(TaskRunRecord.created_at < last_day).delete(
        synchronize_session=False
    )
    session.commit()


@with_session
def clean_up_query_execution(days_to_keep_done=90, days_to_keep_else=30, session=None):
    last_day_for_done = datetime.now() - timedelta(days_to_keep_done)
    last_day_for_else = datetime.now() - timedelta(days_to_keep_else)

    # Delete completed queries
    query = (
        session.query(QueryExecution)
        .filter(QueryExecution.status == QueryExecutionStatus.DONE)
        .filter(QueryExecution.completed_at < last_day_for_done)
    )
    query_execution_ids_to_delete = [query_exec.id for query_exec in query.all()]
    query.delete(synchronize_session=False)

    # Delete else
    query = (
        session.query(QueryExecution)
        .filter(QueryExecution.status != QueryExecutionStatus.DONE)
        .filter(QueryExecution.created_at < last_day_for_else)
    )
    query_execution_ids_to_delete += [query_exec.id for query_exec in query.all()]
    query.delete(synchronize_session=False)

    session.commit()

    for query_exec_id in query_execution_ids_to_delete:
        update_es_query_execution_by_id(query_exec_id)


@with_session
def clean_up_impression(days_to_keep=30, session=None):
    last_day = datetime.now() - timedelta(days_to_keep)

    session.query(Impression).filter(Impression.created_at < last_day).delete(
        synchronize_session=False
    )
    session.commit()


@with_session
def clean_up_archived_data_doc(days_to_keep=60, session=None):
    last_day = datetime.now() - timedelta(days_to_keep)

    session.query(DataDoc).filter(DataDoc.archived).filter(
        DataDoc.updated_at < last_day
    ).delete(synchronize_session=False)
    session.commit()


@with_session
def clean_up_event_logs(days_to_keep=7, session=None):
    last_day = datetime.now() - timedelta(days_to_keep)

    session.query(EventLog).filter(EventLog.created_at < last_day).delete(
        synchronize_session=False
    )
    session.commit()
