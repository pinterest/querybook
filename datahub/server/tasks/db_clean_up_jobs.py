from app.flask_app import celery
from datetime import datetime, timedelta

from app.db import DBSession, with_session
from const.query_execution import QueryExecutionStatus
from models.schedule import TaskRunRecord
from models.query_execution import QueryExecution
from models.impression import Impression
from models.datadoc import DataDoc


@celery.task
def run_all_db_clean_up_jobs(
    days_to_keep_task_record=None,
    days_to_keep_query_exec_done=None,
    days_to_keep_query_exec_else=None,
    days_to_keep_impression=None,
    days_to_keep_archived_data_doc=None,
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
    last_day = datetime.now() - timedelta(days_to_keep)
    old_records = (
        session.query(TaskRunRecord).filter(TaskRunRecord.created_at < last_day).all()
    )
    if not old_records:
        return

    for old_record in old_records:
        session.delete(old_record)
    session.commit()


@with_session
def clean_up_query_execution(days_to_keep_done=90, days_to_keep_else=30, session=None):
    last_day_for_done = datetime.now() - timedelta(days_to_keep_done)
    last_day_for_else = datetime.now() - timedelta(days_to_keep_else)

    old_executions_done = (
        session.query(QueryExecution)
        .filter(QueryExecution.status == QueryExecutionStatus.DONE)
        .filter(QueryExecution.completed_at < last_day_for_done)
        .all()
    )
    old_executions_else = (
        session.query(QueryExecution)
        .filter(QueryExecution.status != QueryExecutionStatus.DONE)
        .filter(QueryExecution.completed_at < last_day_for_else)
        .all()
    )
    if not old_executions_done and not old_executions_else:
        return

    for old_execution_done in old_executions_done:
        session.delete(old_execution_done)
    for old_execution_else in old_executions_else:
        session.delete(old_execution_else)
    session.commit()


@with_session
def clean_up_impression(days_to_keep=30, session=None):
    last_day = datetime.now() - timedelta(days_to_keep)
    old_impressions = (
        session.query(Impression).filter(Impression.created_at < last_day).all()
    )
    if not old_impressions:
        return

    for old_impression in old_impressions:
        session.delete(old_impression)
    session.commit()


@with_session
def clean_up_archived_data_doc(days_to_keep=60, session=None):
    last_day = datetime.now() - timedelta(days_to_keep)
    old_archived_data_docs = (
        session.query(DataDoc)
        .filter(DataDoc.archived == 1)
        .filter(DataDoc.updated_at < last_day)
        .all()
    )
    if not old_archived_data_docs:
        return
    for old_archived_data_doc in old_archived_data_docs:
        session.delete(old_archived_data_doc)
    session.commit()
