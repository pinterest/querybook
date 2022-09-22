from app.flask_app import celery

from models.schedule import (
    TaskSchedule,
)
from app.db import with_session
from logic.schedule import (
    DATADOC_SCHEDULE_PREFIX,
    update_task_schedule,
    with_task_logging,
)
from logic.datadoc import get_data_doc_by_id
from logic.user import get_user_by_id
from lib.logger import get_logger

logger = get_logger(__name__)


@with_session
def get_scheduled_datadoc_tasks(session=None):
    return (
        session.query(TaskSchedule)
        .filter(
            TaskSchedule.enabled.is_(True),
            TaskSchedule.name.like(DATADOC_SCHEDULE_PREFIX + "%"),
        )
        .all()
    )


def get_task_owner(task, session):
    doc_id = task.kwargs["doc_id"]
    task_uid = task.kwargs.get("user_id")

    if not task_uid:
        doc = get_data_doc_by_id(doc_id, session=session)
        task_uid = doc.owner_uid

    task_owner = get_user_by_id(task_uid, session=session)
    return task_owner


@with_session
def disable_deactivated_scheduled_docs(session=None):
    disabled_scheduled_doc_ids = []
    tasks = get_scheduled_datadoc_tasks(session=session)
    for task in tasks:
        task_owner = get_task_owner(task, session=session)
        if task_owner.deleted:
            update_task_schedule(task.id, commit=False, session=session, enabled=False)
            disabled_scheduled_doc_ids.append(task.kwargs["doc_id"])

    session.commit()
    return disabled_scheduled_doc_ids


@celery.task(bind=True)
@with_task_logging()
def disable_scheduled_docs(self):
    disabled_scheduled_doc_ids = disable_deactivated_scheduled_docs()
    if len(disabled_scheduled_doc_ids) == 0:
        logger.info("No scheduled docs disabled.")
    else:
        logger.info(
            f"{len(disabled_scheduled_doc_ids)} scheduled docs were disabled, doc ids: {disabled_scheduled_doc_ids}."
        )
