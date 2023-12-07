from app.datasource import register, api_assert, admin_only
from app.db import DBSession
from const.admin import AdminOperation, AdminItemType
from lib.celery.cron import validate_cron
from lib.celery.utils import (
    get_all_registered_celery_tasks,
    get_all_registered_celery_task_params,
)
from logic import schedule as logic
from datasources.admin_audit_log import with_admin_audit_log
from models.schedule import TaskSchedule


@register(
    "/schedule/",
    methods=["POST"],
)
@admin_only
@with_admin_audit_log(AdminItemType.Task, AdminOperation.CREATE)
def create_task_schedule(
    cron,
    name,
    task,
    enabled,
    args=None,
    kwargs=None,
    options=None,
):
    with DBSession() as session:
        api_assert(validate_cron(cron), "Invalid cron expression")

        return logic.create_task_schedule(
            name=name,
            task=task,
            cron=cron,
            args=args,
            kwargs=kwargs,
            options=options,
            enabled=enabled,
            session=session,
        )


@register(
    "/schedule/name/<name>/",
    methods=["GET"],
)
@admin_only
def get_schedule_by_name(name):
    return TaskSchedule.get(name=name)


@register(
    "/schedule/record/name/<name>/",
    methods=["GET"],
)
@admin_only
def get_task_run_record_by_name(name, offset=0, limit=10, hide_successful_jobs=False):
    api_assert(limit < 1000, "You are requesting too much data")

    records, count = logic.get_task_run_record_run_by_name(
        name=name, offset=offset, limit=limit
    )

    return {"data": records, "count": count}


@register(
    "/schedule/<int:id>/",
    methods=["PUT"],
)
@admin_only
@with_admin_audit_log(AdminItemType.Task, AdminOperation.UPDATE)
def update_schedule(id, **kwargs):
    allowed_fields = ["cron", "args", "kwargs", "enabled", "options"]
    filtered_kwargs = {k: v for k, v in kwargs.items() if k in allowed_fields}

    if "cron" in filtered_kwargs:
        api_assert(validate_cron(filtered_kwargs["cron"]), "Invalid cron expression")

    return logic.update_task_schedule(id=id, **filtered_kwargs)


@register("/schedule/", methods=["GET"])
@admin_only
def get_all_tasks():
    return TaskSchedule.get_all()


@register("/schedule/<int:id>/", methods=["DELETE"])
@admin_only
@with_admin_audit_log(AdminItemType.Task, AdminOperation.DELETE)
def delete_task_schedule(
    id,
):
    TaskSchedule.delete(id)


@register(
    "/schedule/<int:id>/run/",
    methods=["POST"],
)
@admin_only
def run_scheduled_task(id):
    logic.run_and_log_scheduled_task(scheduled_task_id=id)


@register(
    "/schedule/record/",
    methods=["GET"],
)
@admin_only
def get_task_run_records(
    name, offset=0, limit=10, hide_successful_jobs=False, task_type=None
):
    api_assert(limit < 100, "You are requesting too much data")

    with DBSession() as session:
        records = logic.get_task_run_records(
            name=name,
            offset=offset,
            limit=limit,
            hide_successful_jobs=hide_successful_jobs,
            task_type=task_type,
            session=session,
        )

        data = []
        for record in records:
            record_dict = record.to_dict()
            record_dict["task_type"] = record.task.task_type
            data.append(record_dict)

        return data


@register(
    "/schedule/<int:id>/record/",
    methods=["GET"],
)
@admin_only
def get_task_run_records_by_name(id, offset=0, limit=10, hide_successful_jobs=False):
    api_assert(limit < 100, "You are requesting too much data")

    with DBSession() as session:
        task = logic.get_task_schedule_by_id(id=id, session=session)
        api_assert(task, "Invalid task id")

        records, _ = logic.get_task_run_record_run_by_name(
            name=task.name,
            offset=offset,
            limit=limit,
            hide_successful_jobs=hide_successful_jobs,
            session=session,
        )

        data = []
        for record in records:
            record_dict = record.to_dict()
            record_dict["task_type"] = record.task.task_type
            data.append(record_dict)

        return data


@register(
    "/schedule/tasks_list/",
    methods=["GET"],
)
@admin_only
def get_registered_tasks_list():
    return get_all_registered_celery_tasks()


@register(
    "/schedule/tasks_list/params/",
    methods=["GET"],
)
@admin_only
def get_all_registered_task_params():
    return get_all_registered_celery_task_params()
