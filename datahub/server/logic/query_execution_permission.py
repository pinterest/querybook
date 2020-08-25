from flask_login import current_user
from app.datasource import api_assert
from logic import (
    admin as admin_logic,
    query_execution as query_execution_logic,
    environment as environment_logic,
)
from logic.datadoc_permission import user_can_read
from app.db import with_session


@with_session
def user_can_access_query_execution(execution, session=None):
    if execution.uid == current_user.id:
        return True

    query_engine = admin_logic.get_query_engine_by_id(execution.engine_id)
    environment = environment_logic.get_environment_by_id(query_engine.environment_id)
    if environment.shareable:
        return True

    execution_data_doc_ids = query_execution_logic.get_datadoc_id_from_query_execution_id(
        execution.id
    )
    if execution_data_doc_ids:
        for data_doc_pair in execution_data_doc_ids:
            doc_id, cell_id = data_doc_pair
            if user_can_read(doc_id=doc_id, uid=current_user.id):
                return True

    return (
        query_execution_logic.get_query_execution_viewer(
            uid=current_user.id, execution_id=execution.id
        )
        is not None
    )


@with_session
def verify_user_is_execution_owner(execution_id, session=None):
    execution = query_execution_logic.get_query_execution_by_id(
        execution_id, session=session
    )
    execution_dict = execution.to_dict(True) if execution is not None else None
    api_assert(
        current_user.id == execution_dict["uid"],
        "Action can only be preformed by execution owner",
    )


@with_session
def verify_query_execution_access(execution_id, session=None):
    execution = query_execution_logic.get_query_execution_by_id(
        execution_id, session=session
    )
    api_assert(
        user_can_access_query_execution(execution), "CANNOT_ACCESS_QUERY_EXECUTION", 403
    )
