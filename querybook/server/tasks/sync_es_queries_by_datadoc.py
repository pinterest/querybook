from app.db import DBSession, with_session
from app.flask_app import celery
from lib.celery.task_decorator import debounced_task


@with_session
def _sync_query_cells_by_data_doc_id(doc_id, session=None):
    # Delaying this import to avoid circular dependency
    from logic.elasticsearch import update_query_cell_by_id
    from logic.datadoc import get_query_cells_by_data_doc_id

    query_cells = get_query_cells_by_data_doc_id(doc_id, session=session)
    for cell in query_cells:
        update_query_cell_by_id(cell.id, session=session)


@with_session
def _sync_query_executions_by_data_doc_id(doc_id, session=None):
    # Delaying this import to avoid circular dependency
    from logic.elasticsearch import update_query_execution_by_id
    from logic.datadoc import get_query_executions_by_data_doc_id

    query_executions = get_query_executions_by_data_doc_id(doc_id, session=session)
    for execution in query_executions:
        update_query_execution_by_id(execution.id, session=session)


@debounced_task(countdown=60)
@celery.task(bind=True)
def sync_es_queries_by_datadoc_id(self, doc_id, *args, **kwargs):
    with DBSession() as session:
        _sync_query_executions_by_data_doc_id(doc_id, session=session)
        _sync_query_cells_by_data_doc_id(doc_id, session=session)


@debounced_task(countdown=60)
@celery.task(bind=True)
def sync_es_query_cells_by_datadoc_id(self, doc_id, *args, **kwargs):
    _sync_query_cells_by_data_doc_id(doc_id)
