from logic import schedule as logic
from app.flask_app import celery
from app.datasource import register, api_assert, admin_only
from app.db import DBSession
from lib.celery.cron import validate_cron
from lib.celery.utils import get_all_registered_celery_tasks


@register(
    "/schedule/", methods=["POST"],
)
@admin_only
def create_task_schedule(
    cron, name, task, task_type, enabled, args=None, kwargs=None, options=None,
):
    with DBSession() as session:
        api_assert(validate_cron(cron), "Invalid cron expression")

        schedule = logic.create_task_schedule(
            name=name,
            task=task,
            cron=cron,
            args=args,
            kwargs=kwargs,
            task_type=task_type,
            options=options,
            enabled=enabled,
            session=session,
        )

        return schedule.to_dict()


@register(
    "/schedule/name/<name>/", methods=["GET"],
)
@admin_only
def get_schedule_by_name(name):
    schedule = logic.get_task_schedule_by_name(name)
    if schedule:
        return schedule.to_dict()


@register(
    "/schedule/record/name/<name>/", methods=["GET"],
)
@admin_only
def get_task_run_record_by_name(name, offset=0, limit=10, hide_successful_jobs=False):
    api_assert(limit < 1000, "You are requesting too much data")

    records, count = logic.get_task_run_record_run_by_name(
        name=name, offset=offset, limit=limit
    )

    return {"data": [record.to_dict() for record in records], "count": count}


@register(
    "/schedule/<int:id>/", methods=["PUT"],
)
@admin_only
def update_schedule(id, **kwargs):
    allowed_fields = ["cron", "args", "kwargs", "enabled", "options"]
    filtered_kwargs = {k: v for k, v in kwargs.items() if k in allowed_fields}

    if "cron" in filtered_kwargs:
        api_assert(validate_cron(filtered_kwargs["cron"]), "Invalid cron expression")

    schedule = logic.update_task_schedule(id=id, **filtered_kwargs)

    if schedule:
        return schedule.to_dict()


@register(
    "/schedule/<int:id>/run/", methods=["POST"],
)
@admin_only
def run_scheduled_task(id):
    schedule = logic.get_task_schedule_by_id(id)
    if schedule:
        schedule_dict = schedule.to_dict()

        celery.send_task(
            schedule_dict["task"],
            args=schedule_dict["args"],
            kwargs=schedule_dict["kwargs"],
            shadow=schedule_dict["name"],
        )


@register(
    "/schedule/tasks/list/", methods=["GET"],
)
@admin_only
def get_registered_tasks_list():
    return get_all_registered_celery_tasks()
