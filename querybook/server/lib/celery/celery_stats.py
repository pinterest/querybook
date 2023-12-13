import time
import threading
from lib.stats_logger import stats_logger, ACTIVE_WORKERS, ACTIVE_TASKS


def send_stats_logger_metrics(celery):
    while True:
        i = celery.control.inspect()

        stats = i.stats() or {}
        active = i.active() or {}

        active_workers = list(stats.keys())
        active_tasks = 0
        for worker in active_workers:
            if worker in active:
                if len(active[worker]) > 0:
                    active_tasks += 1

        stats_logger.gauge(ACTIVE_WORKERS, len(active_workers))
        stats_logger.gauge(ACTIVE_TASKS, active_tasks)
        time.sleep(5)


def start_stats_logger_monitor(celery):
    thread = threading.Thread(
        target=send_stats_logger_metrics, args=[celery], daemon=True
    )
    thread.start()
