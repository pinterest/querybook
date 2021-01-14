from app.flask_app import celery
from logic.schedule import with_task_logging
from lib.celery.task_decorator import debounced_task
from lib.logger import get_logger

LOG = get_logger(__file__)


@celery.task(bind=True)
@with_task_logging()
def dummy_task(*args, **kwargs):
    LOG.info("This is a dummy task")
    LOG.info("It doesn't do anything")
    LOG.info(args)
    LOG.info(kwargs)


@celery.task(bind=True)
@with_task_logging()
def dummy_task_fail(*args, **kwargs):
    LOG.info("This is a dummy task")
    LOG.info("It will fail")
    raise Exception("dummy")


@debounced_task(30)
@celery.task(bind=True)
def dummy_debounced_task(*args, **kwargs):
    LOG.info("This is a dummy debounced task")
