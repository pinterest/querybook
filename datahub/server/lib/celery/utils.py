from celery import current_app
from app.flask_app import celery
from lib.utils.utils import get_default_args

# must import explicitly for celery to recognize registered tasks
from tasks import all_tasks

all_tasks


# from https://stackoverflow.com/questions/26058156/celery-get-list-of-registered-tasks/26211200
def get_all_registered_celery_tasks():
    tasks = list(
        sorted(name for name in current_app.tasks if not name.startswith("celery."))
    )
    return tasks


def get_all_registered_celery_task_params():
    task_params = {}
    for task in celery.tasks:
        if not task.startswith("celery."):
            task_params[task] = get_default_args(celery.tasks[task])
    return task_params
