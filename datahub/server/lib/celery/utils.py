from celery import current_app

# must import explicitly for celery to recognize registered tasks
from tasks.run_query import run_query_task

# from tasks.dummy_task import dummy_task
from tasks.update_metastore import update_metastore
from tasks.sync_elasticsearch import sync_elasticsearch
from tasks.run_datadoc import run_datadoc
from tasks.delete_mysql_cache import delete_mysql_cache
from tasks.poll_engine_status import poll_engine_status
from tasks.presto_hive_function_scrapper import presto_hive_function_scrapper
from tasks.db_clean_up_jobs import run_all_db_clean_up_jobs

run_query_task
# dummy_task
update_metastore
sync_elasticsearch
run_datadoc
delete_mysql_cache
poll_engine_status
presto_hive_function_scrapper
run_all_db_clean_up_jobs


# from https://stackoverflow.com/questions/26058156/celery-get-list-of-registered-tasks/26211200
def get_all_registered_celery_tasks():
    current_app.loader.import_default_modules()
    tasks = list(
        sorted(name for name in current_app.tasks if not name.startswith("celery."))
    )
    return tasks
