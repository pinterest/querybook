from celery.signals import (
    celeryd_init,
    task_failure,
    task_success,
    task_received,
    beat_init,
)
from celery.utils.log import get_task_logger
from importlib import import_module

from app.flask_app import celery
from env import QuerybookSettings
from lib.logger import get_logger
from lib.stats_logger import (
    TASK_FAILURES,
    TASK_SUCCESSES,
    TASK_RECEIVED,
    ACTIVE_WORKERS,
    ACTIVE_TASKS,
    stats_logger,
)
from lib.celery.celery_stats import start_stats_logger_monitor

from .export_query_execution import export_query_execution_task
from .run_query import run_query_task
from .run_sample_query import run_sample_query
from .dummy_task import dummy_task
from .update_metastore import update_metastore
from .sync_elasticsearch import sync_elasticsearch
from .run_datadoc import run_datadoc
from .delete_mysql_cache import delete_mysql_cache
from .poll_engine_status import poll_engine_status
from .presto_hive_function_scrapper import presto_hive_function_scrapper
from .db_clean_up_jobs import run_all_db_clean_up_jobs
from .disable_scheduled_docs import disable_scheduled_docs
from logic.schedule import get_schedule_task_type

LOG = get_logger(__file__)

try:
    tasks_module = import_module("tasks_plugin")
except (ImportError, ModuleNotFoundError) as err:
    LOG.info("Cannot import %s for tasks due to: %s", "task_plugin", err)

# Linter
celery
export_query_execution_task
run_query_task
dummy_task
update_metastore
sync_elasticsearch
run_datadoc
delete_mysql_cache
poll_engine_status
presto_hive_function_scrapper
run_all_db_clean_up_jobs
run_sample_query
disable_scheduled_docs

LOG = get_task_logger(__name__)


@celeryd_init.connect
def configure_workers(sender=None, conf=None, **kwargs):
    if QuerybookSettings.PRODUCTION:
        LOG.info(f"Starting PROD Celery worker: {sender}")

        from logic.query_execution import clean_up_query_execution

        clean_up_query_execution()
    else:
        LOG.info(f"Starting DEV Celery worker: {sender}")


@task_failure.connect
def handle_task_failure(sender, signal, *args, **kwargs):
    tags = {"task_name": sender.name, "task_type": get_schedule_task_type(sender.name)}
    stats_logger.incr(TASK_FAILURES, tags=tags)


@task_success.connect
def handle_task_success(sender, signal, *args, **kwargs):
    tags = {"task_name": sender.name, "task_type": get_schedule_task_type(sender.name)}
    stats_logger.incr(TASK_SUCCESSES, tags=tags)


@task_received.connect
def handle_task_received(sender, signal, *args, **kwargs):
    tags = {"task_name": kwargs["request"].name}
    tags["task_type"] = get_schedule_task_type(tags["task_name"])
    stats_logger.incr(TASK_RECEIVED, tags=tags)


@beat_init.connect
def start_celery_stats_logging(sender=None, conf=None, **kwargs):
    LOG.info("Starting Celery Beat")
    start_stats_logger_monitor(celery)
    stats_logger.gauge(ACTIVE_WORKERS, 0)
    stats_logger.gauge(ACTIVE_TASKS, 0)
