from app.flask_app import celery
from logic.schedule import with_task_logging
from lib.celery.task_decorator import debounced_task


@celery.task(bind=True)
@with_task_logging()
def dummy_task(*args, **kwargs):
    print("This is a dummy task")
    print("It doesn't do anything")
    print(args)
    print(kwargs)


@celery.task(bind=True)
@with_task_logging()
def dummy_task_fail(*args, **kwargs):
    print("This is a dummy task")
    print("It will fail")
    raise Exception("dummy")


@debounced_task(30)
@celery.task(bind=True)
def dummy_debounced_task(*args, **kwargs):
    print("This is a dummy debounced task")
