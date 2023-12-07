from datetime import datetime
from functools import wraps
from sqlalchemy.sql.expression import func, and_

from app.flask_app import celery
from app.db import with_session
from const.schedule import TaskRunStatus, ScheduleTaskType, UserTaskNames
from lib.sqlalchemy import update_model_fields
from models.schedule import (
    TaskSchedule,
    TaskRunRecord,
)
from models.datadoc import DataDoc
from models.board import BoardItem

DATADOC_SCHEDULE_PREFIX = "run_data_doc_"


def get_schedule_task_type(task_name: str) -> ScheduleTaskType:
    if task_name in UserTaskNames:
        return ScheduleTaskType.USER
    else:
        return ScheduleTaskType.PROD


@with_session
def get_all_task_schedules(offset=0, limit=100, session=None):
    return session.query(TaskSchedule).offset(offset).limit(limit).all()


@with_session
def get_all_active_task_schedules(session=None):
    return session.query(TaskSchedule).filter(TaskSchedule.enabled.is_(True)).all()


@with_session
def get_task_schedule_by_id(id, session=None):
    return session.query(TaskSchedule).get(id)


@with_session
def get_task_schedule_by_name(name, session=None):
    return session.query(TaskSchedule).filter(TaskSchedule.name == name).first()


@with_session
def create_task_schedule(
    name,
    task,
    cron=None,
    start_time=None,
    args=None,
    kwargs=None,
    options=None,
    enabled=None,
    commit=True,
    session=None,
):
    schedule = TaskSchedule(
        name=name,
        task=task,
        cron=cron,
        start_time=start_time,
        args=args or [],
        kwargs=kwargs or {},
        options=options or {},
        enabled=enabled,
        task_type=get_schedule_task_type(name).value,
    )

    session.add(schedule)

    if commit:
        session.commit()
    else:
        session.flush()
    schedule.id
    return schedule


@with_session
def update_task_schedule(id, commit=True, session=None, no_changes=False, **kwargs):

    task_schedule = get_task_schedule_by_id(id, session=session)

    if not task_schedule:
        raise Exception("unable to find any schedules for id {}".format(id))

    update_model_fields(
        task_schedule,
        field_names=[
            "task",
            "cron",
            "start_time",
            "args",
            "kwargs",
            "last_run_at",
            "total_run_count",
            "enabled",
            "no_changes",
        ],
        no_changes=no_changes,
        **kwargs,
    )

    if commit:
        session.commit()

    return task_schedule


@with_session
def update_datadoc_schedule_owner(
    doc_id,
    owner_id,
    commit=True,
    session=None,
):
    """Update datadoc schedule's owner, which is the user_id field in kwargs."""
    schedule_name = get_data_doc_schedule_name(doc_id)
    task_schedule = get_task_schedule_by_name(schedule_name, session=session)

    if not task_schedule:
        return

    task_schedule.kwargs = {**task_schedule.kwargs, "user_id": owner_id}

    if commit:
        session.commit()

    return task_schedule


@with_session
def delete_task_schedule(id, commit=True, session=None):
    task_schedule = get_task_schedule_by_id(id=id, session=session)
    if task_schedule:
        session.delete(task_schedule)
        if commit:
            session.commit()


@with_session
def get_task_run_records(
    name="",
    limit=20,
    offset=0,
    hide_successful_jobs=False,
    task_type=None,
    session=None,
):
    query = session.query(TaskRunRecord)
    if task_type is not None:
        query = query.join(TaskSchedule).filter(TaskSchedule.task_type == task_type)
    if name:
        query = query.filter(TaskRunRecord.name.like("%" + name + "%"))
    if hide_successful_jobs:
        query = query.filter(TaskRunRecord.status != TaskRunStatus.SUCCESS)

    query = query.order_by(TaskRunRecord.id.desc())
    jobs = query.offset(offset).limit(limit).all()
    return jobs


@with_session
def get_task_run_record_run_by_name(
    name, limit=20, offset=0, hide_successful_jobs=False, session=None
):
    query = session.query(TaskRunRecord).filter(TaskRunRecord.name == name)
    query = query.order_by(TaskRunRecord.created_at.desc())

    if hide_successful_jobs:
        query = query.filter(TaskRunRecord.status != TaskRunStatus.SUCCESS)

    tasks = query.offset(offset).limit(limit).all()
    count = query.count()
    return tasks, count


def get_data_doc_schedule_name(id: int):
    return f"{DATADOC_SCHEDULE_PREFIX}{id}"


@with_session
def get_scheduled_data_docs_by_user(
    uid, environment_id, offset, limit, filters={}, session=None
):
    query = (
        session.query(DataDoc, TaskSchedule)
        .join(
            TaskSchedule,
            TaskSchedule.name == func.concat(DATADOC_SCHEDULE_PREFIX, DataDoc.id),
            isouter=(not filters.get("scheduled_only", False)),
        )
        .filter(DataDoc.owner_uid == uid)
        .filter(DataDoc.archived == False)  # noqa: E712
        .filter(DataDoc.environment_id == environment_id)
        .order_by(DataDoc.id.desc())
    )

    if "name" in filters:
        query = query.filter(DataDoc.title.contains(filters.get("name")))

    if filters.get("status") is not None:
        query = query.filter(TaskSchedule.enabled == filters.get("status"))

    if filters.get("board_ids"):
        query = query.join(BoardItem, BoardItem.data_doc_id == DataDoc.id).filter(
            BoardItem.parent_board_id.in_(filters.get("board_ids"))
        )

    count = query.count()
    docs_with_schedules = query.offset(offset).limit(limit).all()
    docs_with_schedules_and_records = get_task_run_record_run_with_schedule(
        docs_with_schedules, session=session
    )

    return docs_with_schedules_and_records, count


@with_session
def get_task_run_record_run_with_schedule(docs_with_schedule, session):
    all_schedules_names = [
        schedule.name for _, schedule in docs_with_schedule if schedule is not None
    ]

    last_run_record_subquery = (
        session.query(
            TaskRunRecord.name, func.max(TaskRunRecord.created_at).label("max_date")
        )
        .filter(TaskRunRecord.name.in_(all_schedules_names))
        .group_by(TaskRunRecord.name)
        .subquery()
    )
    last_task_run_records = (
        session.query(TaskRunRecord)
        .join(
            last_run_record_subquery,
            and_(
                TaskRunRecord.created_at == last_run_record_subquery.c.max_date,
                last_run_record_subquery.c.name == TaskRunRecord.name,
            ),
        )
        .all()
    )

    docs_with_schedule_and_record = []
    for doc, schedule in docs_with_schedule:
        last_record = None
        if schedule:
            last_record = next(
                filter(
                    lambda record: record.name == schedule.name, last_task_run_records
                ),
                None,
            )
        docs_with_schedule_and_record.append(
            {"last_record": last_record, "schedule": schedule, "doc": doc}
        )
    return docs_with_schedule_and_record


@with_session
def get_task_run_record(id, session=None):
    return session.query(TaskRunRecord).get(id)


@with_session
def create_task_run_record(name, session=None):
    task_record = TaskRunRecord(name=name)

    session.add(task_record)
    session.commit()

    task_record.id
    return task_record


@with_session
def update_task_run_record(id, status=None, error_message=None, session=None):
    run = get_task_run_record(id, session=session)
    if run:
        if status is not None:
            run.status = status

        if error_message is not None:
            run.error_message = error_message

        run.updated_at = datetime.now()
        session.commit()

        run.id
        return run


@with_session
def create_task_run_record_for_celery_task(task, session=None):
    job_name = task.request.get("shadow", task.name)
    return create_task_run_record(name=job_name, session=session).id


def with_task_logging(
    # TODO: add some alerting feature here
):
    def base_job_decorator(job_func):
        from celery.utils.log import get_task_logger

        logger = get_task_logger(__name__)

        @wraps(job_func)
        def wrapper(self, *args, **kwargs):
            record_id = None
            try:
                record_id = create_task_run_record_for_celery_task(self)
                result = job_func(self, *args, **kwargs)
                update_task_run_record(id=record_id, status=TaskRunStatus.SUCCESS)

                return result
            except Exception as e:
                logger.info(e)
                if record_id is not None:
                    update_task_run_record(
                        id=record_id, error_message=str(e), status=TaskRunStatus.FAILURE
                    )
                raise e

        return wrapper

    return base_job_decorator


@with_session
def run_and_log_scheduled_task(scheduled_task_id, wait_to_finish=False, session=None):
    schedule = get_task_schedule_by_id(scheduled_task_id)
    if schedule:
        result = celery.send_task(
            schedule.task,
            args=schedule.args,
            kwargs=schedule.kwargs,
            shadow=schedule.name,
        )
        if wait_to_finish:
            result.get(timeout=60)
        update_task_schedule(
            id=schedule.id,
            last_run_at=datetime.now(),
            total_run_count=(schedule.total_run_count + 1),
            session=session,
        )


@with_session
def get_all_task_schedule(enabled=None, session=None):
    query = session.query(TaskSchedule)

    if enabled is not None:
        query = query.filter_by(enabled=enabled)

    return query.all()
