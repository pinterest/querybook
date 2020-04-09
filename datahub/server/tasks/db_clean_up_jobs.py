from app.flask_app import celery
from datetime import datetime

from app.db import DBSession, with_session
from const.query_execution import QueryExecutionStatus
from models.schedule import TaskRunRecord
from models.query_execution import QueryExecution
from models.impression import Impression
from models.datadoc import DataDoc


@celery.task
def run_all_clean_up_jobs(
    days_to_keep_task_record,
    days_to_keep_query_exec_done,
    days_to_keep_query_exec_else,
    days_to_keep_impression,
    days_to_keep_archived_data_doc,
):
    with DBSession() as session:
        clean_up_task_run_record(days_to_keep=days_to_keep_task_record, session=session)
        clean_up_query_execution(
            days_to_keep_done=days_to_keep_query_exec_done,
            days_to_keep_else=days_to_keep_query_exec_else,
            session=session,
        )
        clean_up_impression(days_to_keep=days_to_keep_impression, session=session)
        clean_up_archived_data_doc(
            days_to_keep=days_to_keep_archived_data_doc, session=session
        )
        return


@with_session
def clean_up_task_run_record(days_to_keep=30, session=None):
    last_day = datetime.now() - datetime.timedelta(days_to_keep)
    old_records = session.query(TaskRunRecord).filter(
        TaskRunRecord.created_at < last_day
    )
    if not old_records:
        return

    session.delete(old_records)
    session.commit()


@with_session
def clean_up_query_execution(days_to_keep_done=90, days_to_keep_else=30, session=None):
    last_day_for_done = datetime.now() - datetime.timedelta(days_to_keep_done)
    last_day_for_else = datetime.now() - datetime.timedelta(days_to_keep_else)

    old_executions_done = (
        session.query(QueryExecution)
        .filter(QueryExecution.status == QueryExecutionStatus.DONE)
        .filter(QueryExecution.completed_at < last_day_for_done)
    )
    old_executions_else = (
        session.query(QueryExecution)
        .filter(QueryExecution.status != QueryExecutionStatus.DONE)
        .filter(QueryExecution.completed_at < last_day_for_else)
    )
    if not old_executions_done and not old_executions_else:
        return

    session.delete(old_executions_done)
    session.delete(old_executions_else)
    session.commit()


@with_session
def clean_up_impression(days_to_keep=30, session=None):
    last_day = datetime.now() - datetime.timedelta(days_to_keep)
    old_impressions = session.query(Impression).filter(Impression.created_at < last_day)
    if not old_impressions:
        return

    session.delete(old_impressions)
    session.commit()


@with_session
def clean_up_archived_data_doc(days_to_keep=60, session=None):
    last_day = datetime.now() - datetime.timedelta(days_to_keep)
    old_archived_data_docs = (
        session.query(DataDoc)
        .filter(DataDoc.archived == 1)
        .filter(DataDoc.updated_at < last_day)
    )
    if not old_archived_data_docs:
        return

    session.delete(old_archived_data_docs)
    session.commit()
