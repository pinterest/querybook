from flask_login import current_user
from logic import (
    admin as admin_logic,
    query_execution as query_execution_logic,
    environment as environment_logic,
)
from models.query_execution import QueryExecutionViewer
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
        QueryExecutionViewer.get(uid=current_user.id, query_execution_id=execution.id)
        is not None
    )
