from app.flask_app import celery
from lib.celery.task_decorator import debounced_task


@debounced_task()
@celery.task(bind=True)
def delete_mysql_cache(self, key):
    from logic.result_store import delete_key_value_store

    delete_key_value_store(key)
