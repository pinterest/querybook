from logic import query_execution as query_execution_logic
from models.query_execution import QueryExecutionViewer
from logic.datadoc_permission import user_can_read
from app.db import with_session


@with_session
def user_can_access_query_execution(uid, execution, session=None):
    if execution.uid == uid:
        return True

    environment = query_execution_logic.get_environment_by_execution_id(
        execution_id=execution.id, session=session
    )
    if environment.shareable:
        return True

    execution_data_doc_ids = query_execution_logic.get_datadoc_id_from_query_execution_id(
        execution.id, session=session
    )
    if execution_data_doc_ids:
        for data_doc_pair in execution_data_doc_ids:
            doc_id, cell_id = data_doc_pair
            if user_can_read(doc_id=doc_id, uid=uid, session=session):
                return True

    return (
        QueryExecutionViewer.get(uid=uid, query_execution_id=execution.id) is not None
    )
