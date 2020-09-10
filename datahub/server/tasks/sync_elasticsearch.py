from app.flask_app import celery
from lib.celery.task_decorator import debounced_task
from const.elasticsearch import ElasticsearchItem


@debounced_task(countdown=60)
@celery.task(bind=True)
def sync_elasticsearch(self, item_type, item_id, *args, **kwargs):
    # Delaying this import to avoid circular dependency
    from logic.elasticsearch import (
        update_data_doc_by_id,
        update_table_by_id,
        update_user_by_id,
        update_data_cell_data_tables_by_cell_id,
    )

    if item_type == ElasticsearchItem.datadocs.value:
        update_data_doc_by_id(item_id)
    elif item_type == ElasticsearchItem.tables.value:
        update_table_by_id(item_id)
    elif item_type == ElasticsearchItem.users.value:
        update_user_by_id(item_id)
    elif item_type == ElasticsearchItem.data_cell_data_tables.value:
        update_data_cell_data_tables_by_cell_id(item_id)
