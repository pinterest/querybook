from typing import Dict

from app.db import with_session
from const.query_execution import QueryExecutionStatus
from lib.logger import get_logger
from lib.query_analysis.statements import get_statement_ranges
from lib.query_analysis.lineage import process_query
from lib.utils.import_helper import import_module_with_default
from logic import (
    admin as admin_logic,
    query_execution as qe_logic,
    user as user_logic,
)
from .exc import AlreadyExecutedException, InvalidQueryExecution, ArchivedQueryEngine
from .all_executors import get_executor_class

LOG = get_logger(__file__)

EXTRA_CLIENT_SETTINGS_HOOK = import_module_with_default(
    "executor_plugin", "EXTRA_CLIENT_SETTINGS_HOOK", default=None
)


def get_client_setting_override_from_hook() -> Dict:
    """Compute request-scoped client settings from the optional plugin hook.

    Call this while a Flask request is active (for example, right before
    queuing a Celery task). Hook implementations may still return ``{}``
    when no request-scoped settings apply.
    """
    if EXTRA_CLIENT_SETTINGS_HOOK is None:
        return {}
    try:
        return EXTRA_CLIENT_SETTINGS_HOOK() or {}
    except Exception:
        LOG.exception("EXTRA_CLIENT_SETTINGS_HOOK raised; skipping plugin settings")
        return {}


@with_session
def create_executor_from_execution(
    query_execution_id,
    celery_task,
    execution_type,
    session_props,
    client_setting_override=None,
    session=None,
):
    executor_params, engine = _get_executor_params_and_engine(
        query_execution_id,
        celery_task=celery_task,
        execution_type=execution_type,
        session_props=session_props,
        client_setting_override=client_setting_override,
        session=session,
    )
    executor = get_executor_class(engine.language, engine.executor)(**executor_params)
    return executor


@with_session
def _get_executor_params_and_engine(
    query_execution_id,
    celery_task,
    execution_type,
    session_props,
    client_setting_override=None,
    session=None,
):
    query, statement_ranges, uid, engine_id = _get_query_execution_info(
        query_execution_id, session=session
    )

    engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
    if engine.deleted_at is not None:
        raise ArchivedQueryEngine("This query engine is disabled.")

    client_setting = get_client_setting_from_engine(
        engine,
        uid,
        client_setting_override=client_setting_override,
        session=session,
    )

    if session_props:
        client_setting["session_props"] = session_props

    return (
        {
            "query_execution_id": query_execution_id,
            "celery_task": celery_task,
            "query": query,
            "statement_ranges": statement_ranges,
            "client_setting": client_setting,
            "execution_type": execution_type,
        },
        engine,
    )


@with_session
def get_client_setting_from_engine(
    engine, uid=None, client_setting_override=None, session=None
) -> Dict:
    """Compute the settings passed to the query engine.
       Both engine and user must be attached to a sqlalchemy session.

    Args:
        engine (QueryEngine): Corresponds to the DB QueryEngine
        uid (int, optional): Optional User id executed the query. Defaults to None.
        client_setting_override (Dict, optional): Extra kwargs merged into the
            client_setting dict. Async callers should pass an explicit
            override computed before queuing the Celery task. Direct/sync
            callers leave this as ``None`` and the hook (if configured) fires
            inline, using Flask request context when one is available. Plugin
            keys override engine defaults.

    Returns:
        Dict: Dictionary of Kwargs send to the query engine client
    """
    executor_params = {**engine.get_engine_params()}
    if uid is not None:
        user = user_logic.get_user_by_id(uid, session=session)
        proxy_user = user.username
        if executor_params.get("proxy_user_id", "") != "":
            proxy_user = user.to_dict()[executor_params["proxy_user_id"]]
        executor_params["proxy_user"] = proxy_user

    if client_setting_override is None:
        client_setting_override = get_client_setting_override_from_hook()
    if client_setting_override:
        executor_params.update(client_setting_override)

    return executor_params


@with_session
def _get_query_execution_info(query_execution_id, session=None):
    query_execution = qe_logic.get_query_execution_by_id(
        query_execution_id, session=session
    )
    if not query_execution:
        raise InvalidQueryExecution(f"Query {query_execution_id} does not exist")
    if query_execution.status != QueryExecutionStatus.INITIALIZED:
        # Double check to see query has been executed since
        # it could be re-inserted after celery worker failure
        raise AlreadyExecutedException(
            f"Query {query_execution_id} is already executed. This is likely caused by a worker crash."
        )

    query = query_execution.query
    statement_ranges = get_statement_ranges(query)
    uid = query_execution.uid
    engine_id = query_execution.engine_id

    _assert_safe_query(query, engine_id, session=session)
    return query, statement_ranges, uid, engine_id


@with_session
def _assert_safe_query(query, engine_id, session=None):
    try:
        from lib.metastore.utils import MetastoreTableACLChecker

        table_per_statement, _ = process_query(query)
        all_tables = [table for tables in table_per_statement for table in tables]

        query_engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
        if query_engine.metastore_id is None:
            LOG.debug("No metastore for query engine, skipping")
            return

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
