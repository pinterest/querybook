from app.flask_app import celery
from logic.schedule import with_task_logging


@celery.task(bind=True)
@with_task_logging()
def update_metastore(self, id, *args, **kwargs):
    # Delaying this import to avoid circular depdendency
    from lib.metastore import load_metastore

    load_metastore(id)
