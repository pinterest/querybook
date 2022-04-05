from app.db import with_session
from logic import query_execution as query_execution_logic
from logic.datadoc_permission import user_can_read
from logic.environment import get_all_accessible_environment_ids_by_uid
from models.query_execution import QueryExecutionViewer


@with_session
def user_can_access_query_execution(uid, execution_id, session=None):
    execution = query_execution_logic.get_query_execution_by_id(
        execution_id, session=session
    )
    if execution.uid == uid:
        return True

    execution_data_doc_ids = (
        query_execution_logic.get_datadoc_id_from_query_execution_id(
            execution_id, session=session
        )
    )
    if execution_data_doc_ids:
        for data_doc_pair in execution_data_doc_ids:
            doc_id, cell_id = data_doc_pair
            if user_can_read(doc_id=doc_id, uid=uid, session=session):
                return True
    return (
        QueryExecutionViewer.get(uid=uid, query_execution_id=execution_id) is not None
    )


@with_session
def _get_execution_envs_and_user_envs(execution_id, uid, session=None):
    execution_envs = query_execution_logic.get_environments_by_execution_id(
        execution_id, session=session
    )
    user_env_ids = get_all_accessible_environment_ids_by_uid(uid, session=session)
    return execution_envs, filter(lambda env: env.id in user_env_ids, execution_envs)


@with_session
def get_user_environments_by_execution_id(execution_id, uid, session=None):
    """Get all environments that execution belongs in and user can access

    Args:
        execution_id (int): The id of query execution
        uid (int): The id of user
        session (Session, optional): The sqlalchemy session. Defaults to None.

    Returns:
        List[Environment]: A list of environments
    """
    _, user_envs = _get_execution_envs_and_user_envs(execution_id, uid, session=session)
    return list(user_envs)


@with_session
def get_default_user_environment_by_execution_id(execution_id, uid, session=None):
    """Get the first environment that can be accessed by both execution_id and uid,
       If uid can't access any environment of execution then return the first env
       of execution, and if execution belongs to no environment then return None

    Args:
        execution_id (int): The id of query execution
        uid (int): The id of user
        session (Session, optional): The sqlalchemy session. Defaults to None.

    Returns:
        Environment: The first accessible env for user and environment
    """
    execution_envs, user_envs = _get_execution_envs_and_user_envs(
        execution_id, uid, session=session
    )
    return next(user_envs, execution_envs[0] if len(execution_envs) else None)
