from datetime import datetime
from functools import wraps

from app.flask_app import celery
from app.db import with_session
from const.schedule import TaskRunStatus
from lib.sqlalchemy import update_model_fields
from models.schedule import (
    TaskSchedule,
    TaskRunRecord,
)


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
    task_type=None,
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
        task_type=task_type,
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
        **kwargs
    )

    if commit:
        session.commit()
    task_schedule.id
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
def update_task_run_record(id, status=None, alerted=None, session=None):
    run = get_task_run_record(id, session=session)
    if run:
        if status is not None:
            run.status = status

        if alerted is not None:
            run.alerted = alerted

        run.updated_at = datetime.now()
        session.commit()

        run.id
        return run


def with_task_logging(
    # TODO: add some alerting feature here
):
    def base_job_decorator(job_func):
        from celery.utils.log import get_task_logger

        logger = get_task_logger(__name__)

        @wraps(job_func)
        def wrapper(self, *args, **kwargs):
            record_dict = None
            try:
                job_name = self.request.get("shadow", self.name)

                record_dict = create_task_run_record(name=job_name).to_dict()

                result = job_func(self, *args, **kwargs)

                update_task_run_record(
                    id=record_dict["id"], status=TaskRunStatus.SUCCESS
                )

                return result
            except Exception as e:
                logger.info(e)
                if isinstance(record_dict, dict):
                    update_task_run_record(
                        id=record_dict.get("id"), status=TaskRunStatus.FAILURE
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
