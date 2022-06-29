from app.flask_app import celery
from lib.celery.task_decorator import debounced_task
from const.elasticsearch import ElasticsearchItem


@debounced_task(countdown=60)
@celery.task(bind=True)
def sync_elasticsearch(self, item_type, item_id, *args, **kwargs):
    # Delaying this import to avoid circular depdendency
    from logic.elasticsearch import (
        update_data_doc_by_id,
        update_table_by_id,
        update_user_by_id,
        update_query_execution_by_id,
        update_query_cell_by_id,
        update_board_by_id,
    )

    if item_type == ElasticsearchItem.datadocs.value:
        update_data_doc_by_id(item_id)
    elif item_type == ElasticsearchItem.tables.value:
        update_table_by_id(item_id)
    elif item_type == ElasticsearchItem.users.value:
        update_user_by_id(item_id)
    elif item_type == ElasticsearchItem.query_executions.value:
        update_query_execution_by_id(item_id)
    elif item_type == ElasticsearchItem.query_cells.value:
        update_query_cell_by_id(item_id)
    elif item_type == ElasticsearchItem.boards.value:
        update_board_by_id(item_id)
