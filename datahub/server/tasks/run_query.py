import traceback

from app.db import with_session, DBSession
from app.flask_app import celery
from celery.contrib.abortable import AbortableTask
from celery.exceptions import SoftTimeLimitExceeded
from celery.utils.log import get_task_logger
from const.query_execution import QueryExecutionStatus
from env import DataHubSettings
from lib.config import get_config_value
from lib.query_analysis import get_statement_ranges
from lib.query_analysis.lineage import process_query
from lib.query_executor.all_executors import get_executor_class, parse_exception
from logic import (
    admin as admin_logic,
    query_execution as qe_logic,
    user as user_logic,
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

    try:
        # Performance sanity check to see query has been executed
        # Raise AlreadyExecutedException if it has been ran before
        query, statement_ranges, uid, engine_id = get_query_execution_params(
            query_execution_id
        )

        user = user_logic.get_user_by_id(uid)
        engine = admin_logic.get_query_engine_by_id(engine_id)
        executor_type = engine.executor

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

        executor = get_executor_class(executor_type)(**executor_params)

        while True:
            if self.is_aborted():
                executor.cancel()
                break

            executor.poll()
            if executor.status != QueryExecutionStatus.RUNNING:
                break

            executor.sleep()

    except AlreadyExecutedException as e:
        # This error will happen since we turned acks_late = True
        # So in the event of worker unexpected crash, the task
        # will get reassigned

        # The current solution is to just fail silently
        error_message = "%s\n%s" % (e, traceback.format_exc())
        LOG.error(error_message)
    except SoftTimeLimitExceeded as e:
        # This exception happens when query has been running for more than
        # 2 days.
        error_message = "%s\n%s" % (e, traceback.format_exc())
        LOG.error(error_message)

        executor.on_exception(error_message)
    except Exception as e:
        error_message = "%s\n%s" % (e, traceback.format_exc())
        LOG.error(error_message)

        error_type, error_str, error_extracted = parse_exception(e)
        qe_logic.create_query_execution_error(
            query_execution_id,
            error_type=error_type,
            error_message_extracted=error_extracted,
            error_message=error_str,
        )
        qe_logic.update_query_execution(
            query_execution_id, status=QueryExecutionStatus.ERROR
        )
    finally:
        if executor and (
            executor.status == QueryExecutionStatus.INITIALIZED
            or executor.status == QueryExecutionStatus.DELIVERED
            or executor.status == QueryExecutionStatus.RUNNING
        ):

            error_message = "Unknown error, executor not completed when exit"
            LOG.error(error_message)

            qe_logic.create_query_execution_error(
                query_execution_id,
                error_type=None,
                error_message_extracted=error_message,
                error_message=error_message,
            )
            qe_logic.update_query_execution(
                query_execution_id, status=QueryExecutionStatus.ERROR
            )
        elif executor and (
            executor.status == QueryExecutionStatus.DONE
            or executor.status == QueryExecutionStatus.ERROR
        ):
            send_out_notification(query_execution_id)
            if executor.status == QueryExecutionStatus.DONE:
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
                f"Query {query_execution_id} is already executed"
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


def send_out_notification(query_execution_id):
    with DBSession() as session:
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )

        notifications = query_execution.notifications
        if len(notifications):
            data_cell = next(iter(query_execution.cells), None)
            env_name = query_execution.engine.environment.name

            for notification in notifications:
                uid = notification.user
                user = user_logic.get_user_by_id(uid, session=session)
                user_setting = user_logic.get_user_settings(
                    uid, "notification_preference", session=session
                )

                notification_setting = (
                    user_setting.value
                    if user_setting is not None
                    else get_config_value(
                        "user_setting.notification_preference.default"
                    )
                )

                doc_id = None
                cell_id = None
                query_title = "Untitled"

                if data_cell is not None:
                    cell_id = data_cell.id
                    doc_id = data_cell.doc.id
                    query_title = data_cell.meta.get("title", query_title)

                notify_user(
                    user=user,
                    notifier_name=notification_setting,
                    template_name="query_completion_notification",
                    template_params=dict(
                        username=user.username,
                        query_execution=query_execution,
                        doc_id=doc_id,
                        cell_id=cell_id,
                        query_title=query_title,
                        public_url=DataHubSettings.PUBLIC_URL,
                        env_name=env_name,
                    ),
                )


class AlreadyExecutedException(Exception):
    pass


class InvalidQueryExecution(Exception):
    pass
