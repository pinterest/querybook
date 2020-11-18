import traceback

from app.db import with_session, DBSession
from app.flask_app import celery
from celery.contrib.abortable import AbortableTask
from celery.exceptions import SoftTimeLimitExceeded
from celery.utils.log import get_task_logger
from const.query_execution import QueryExecutionStatus
from env import DataHubSettings
from lib.query_analysis import get_statement_ranges
from lib.query_analysis.lineage import process_query
from lib.query_executor.all_executors import get_executor_class
from logic import (
    admin as admin_logic,
    query_execution as qe_logic,
    user as user_logic,
    query_execution_permission as qe_perm_logic,
)
from tasks.log_query_per_table import log_query_per_table_task
from lib.notify.utils import notify_user

LOG = get_task_logger(__name__)


@celery.task(
    bind=True,
    base=AbortableTask,
    # Having acks_late prevents autoscaling to work properly
    # Will disable autoscaling for now but that is something
    # worth to check later
    acks_late=True,
)
def run_query_task(self, query_execution_id):
    executor = None
    error_message = None

    try:
        # Performance sanity check to see query has been executed
        # Raise AlreadyExecutedException if it has been ran before
        query, statement_ranges, uid, engine_id = get_query_execution_params(
            query_execution_id
        )

        user = user_logic.get_user_by_id(uid)
        engine = admin_logic.get_query_engine_by_id(engine_id)

        executor_params = {
            "query_execution_id": query_execution_id,
            "celery_task": self,
            "query": query,
            "statement_ranges": statement_ranges,
            "client_setting": {
                **engine.get_engine_params(),
                "proxy_user": user.username,
            },
        }

        executor = get_executor_class(engine.language, engine.executor)(
            **executor_params
        )

        while True:
            if self.is_aborted():
                executor.cancel()
                break

            executor.poll()
            if executor.status != QueryExecutionStatus.RUNNING:
                break
            executor.sleep()
    except (AlreadyExecutedException, SoftTimeLimitExceeded, Exception) as e:
        # AlreadyExecutedException
        # This error will happen since we turned acks_late = True
        # So in the event of worker unexpected crash, the task
        # will get reassigned

        # SoftTimeLimitExceeded
        # This exception happens when query has been running for more than
        # 2 days.

        error_message = "{}\n{}".format(e, traceback.format_exc())
    finally:
        # When the finally block is reached, it is expected
        # that the executor should be in one of the end state
        with DBSession() as session:
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

            if final_query_status in (
                QueryExecutionStatus.INITIALIZED,
                QueryExecutionStatus.DELIVERED,
                QueryExecutionStatus.RUNNING,
            ):
                if error_message is None:
                    error_message = "Unknown error, executor not completed when exit"
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
                    session=session,
                )

            send_out_notification(query_execution_id, session=session)

            # not using final_query_status because this might be a query
            # that was sent again
            if executor and executor.status == QueryExecutionStatus.DONE:
                log_query_per_table_task.delay(query_execution_id)

    return executor.status.value if executor is not None else None


def get_query_execution_params(query_execution_id):
    with DBSession() as session:
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        if not query_execution:
            raise InvalidQueryExecution(f"Query {query_execution_id} does not exist")
        if query_execution.status != QueryExecutionStatus.INITIALIZED:
            raise AlreadyExecutedException(
                f"Query {query_execution_id} is already executed. This is likely caused by a worker crash."
            )

        query = query_execution.query
        statement_ranges = get_statement_ranges(query)
        uid = query_execution.uid
        engine_id = query_execution.engine_id

        assert_safe_query(query, engine_id, session=session)
        return query, statement_ranges, uid, engine_id


@with_session
def assert_safe_query(query, engine_id, session=None):
    try:
        from lib.metastore.utils import MetastoreTableACLChecker

        LOG.debug("assert_safe_query")
        table_per_statement, _ = process_query(query)
        all_tables = [table for tables in table_per_statement for table in tables]

        query_engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
        metastore = admin_logic.get_query_metastore_by_id(
            query_engine.metastore_id, session=session
        )
        acl_checker = MetastoreTableACLChecker(metastore.acl_control)

        for table in all_tables:
            schema_name, table_name = table.split(".")
            if not acl_checker.is_table_valid(schema_name, table_name):
                raise InvalidQueryExecution(
                    f"Table {table} is not allowed by metastore"
                )
    except InvalidQueryExecution as e:
        raise e
    except Exception as e:
        LOG.info(e)


@with_session
def send_out_notification(query_execution_id, session=None):
    query_execution = qe_logic.get_query_execution_by_id(
        query_execution_id, session=session
    )

    notifications = query_execution.notifications
    if len(notifications):
        data_cell = next(iter(query_execution.cells), None)
        # TODO: this should be determined by the notification.user?
        # Come up with a more efficient way to determine env per user
        env_name = getattr(
            qe_perm_logic.get_default_user_environment_by_execution_id(
                execution_id=query_execution_id,
                uid=query_execution.uid,
                session=session,
            ),
            "name",
            None,
        )

        # If the query execution is not associated with any environment
        # then no notification can be done
        if not env_name:
            return

        for notification in notifications:
            uid = notification.user
            user = user_logic.get_user_by_id(uid, session=session)
            doc_id = None
            cell_id = None
            query_title = "Untitled"

            if data_cell is not None:
                cell_id = data_cell.id
                doc_id = data_cell.doc.id
                query_title = data_cell.meta.get("title", query_title)

            notify_user(
                user=user,
                template_name="query_completion_notification",
                template_params=dict(
                    query_execution=query_execution,
                    doc_id=doc_id,
                    cell_id=cell_id,
                    query_title=query_title,
                    public_url=DataHubSettings.PUBLIC_URL,
                    env_name=env_name,
                ),
                session=session,
            )


class AlreadyExecutedException(Exception):
    pass


class InvalidQueryExecution(Exception):
    pass
