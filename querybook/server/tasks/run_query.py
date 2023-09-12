import traceback
import datetime
from celery.contrib.abortable import AbortableTask
from celery.exceptions import SoftTimeLimitExceeded
from celery.utils.log import get_task_logger

from app.db import with_session, DBSession
from app.flask_app import celery
from const.query_execution import QueryExecutionStatus, QueryExecutionType
from lib.query_executor.notification import notifiy_on_execution_completion
from lib.query_executor.executor_factory import create_executor_from_execution
from lib.query_executor.exc import QueryExecutorException
from lib.query_executor.utils import format_error_message
from lib.stats_logger import QUERY_EXECUTIONS, stats_logger

from logic import query_execution as qe_logic
from logic.elasticsearch import update_query_execution_by_id
from tasks.log_query_per_table import log_query_per_table_task


LOG = get_task_logger(__name__)


@celery.task(
    bind=True,
    base=AbortableTask,
    # Having acks_late prevents autoscaling to work properly
    # Will disable autoscaling for now but that is something
    # worth to check later
    acks_late=True,
)
def run_query_task(
    self, query_execution_id, execution_type=QueryExecutionType.ADHOC.value
):
    stats_logger.incr(QUERY_EXECUTIONS, tags={"execution_type": execution_type})

    executor = None
    error_message = None
    query_execution_status = QueryExecutionStatus.INITIALIZED

    try:
        executor = create_executor_from_execution(
            query_execution_id, celery_task=self, execution_type=execution_type
        )
        run_executor_until_finish(self, executor)
    except SoftTimeLimitExceeded:
        # SoftTimeLimitExceeded
        # This exception happens when query has been running for more than
        # the limited time (default 2 days)
        error_message = format_error_message(
            7408, "The execution has exceeded the maximum allowed time."
        )
    except QueryExecutorException as e:
        error_message = format_error_message(7403, str(e))
    except Exception as e:
        error_message = format_error_message(
            7406, "{}\n{}".format(e, traceback.format_exc())
        )
    finally:
        # When the finally block is reached, it is expected
        # that the executor should be in one of the end state
        with DBSession() as session:
            query_execution_status = get_query_execution_final_status(
                query_execution_id, executor, error_message, session=session
            )
            notifiy_on_execution_completion(query_execution_id, session=session)
            update_query_execution_by_id(query_execution_id, session=session)

            # Executor exists means the query actually executed
            # This prevents cases when query_execution got executed twice
            if executor and query_execution_status == QueryExecutionStatus.DONE:
                log_query_per_table_task.delay(query_execution_id)

    return (
        query_execution_status.value if executor is not None else None,
        query_execution_id,
    )


def run_executor_until_finish(celery_task, executor):
    while True:
        if celery_task.is_aborted():
            executor.cancel()
            break
        executor.poll()
        if executor.status != QueryExecutionStatus.RUNNING:
            break
        executor.sleep()


@with_session
def get_query_execution_final_status(
    query_execution_id, executor, error_message, session=None
):
    final_query_status = QueryExecutionStatus.INITIALIZED
    if executor:
        final_query_status = executor.status
    else:
        # If the error happens before the executor is initialized
        # we check the existing query execution status in db
        # for reference
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        if query_execution is not None:
            final_query_status = query_execution.status

    log_if_incomplete_query_status(
        final_query_status, query_execution_id, error_message, session=session
    )

    return final_query_status


@with_session
def log_if_incomplete_query_status(
    final_query_status, query_execution_id, error_message, session=None
):
    if final_query_status in (
        QueryExecutionStatus.INITIALIZED,
        QueryExecutionStatus.DELIVERED,
        QueryExecutionStatus.RUNNING,
    ):
        if error_message is None:
            error_message = format_error_message(
                7500,
                f"Query stopped execution with status {final_query_status.name}. "
                + "Please rerun your query to see results, the previous run may have completed, or not. ",
            )
        LOG.error(error_message)

        qe_logic.create_query_execution_error(
            query_execution_id,
            error_type=None,
            error_message_extracted=None,
            error_message=error_message,
            session=session,
        )
        qe_logic.update_query_execution(
            query_execution_id,
            status=QueryExecutionStatus.ERROR,
            completed_at=datetime.datetime.utcnow(),
            session=session,
        )
