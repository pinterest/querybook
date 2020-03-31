from app.flask_app import celery
from lib.celery.task_decorator import throttled_task


@throttled_task(countdown=10)
@celery.task(bind=True)
def poll_engine_status(self, checker_name, engine_id):
    from lib.engine_status_checker import get_engine_checker_class

    get_engine_checker_class(checker_name).get_server_status_task(engine_id)
