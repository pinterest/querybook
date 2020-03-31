from celery import chain

from app.flask_app import celery
from app.db import DBSession

from lib.query_analysis.templating import render_templated_query
from const.data_doc import DataCellType
from const.query_execution import QueryExecutionStatus


from logic.schedule import with_task_logging
from logic import datadoc as datadoc_logic
from logic import query_execution as qe_logic
from tasks.run_query import run_query_task


@celery.task(bind=True)
@with_task_logging()
def run_datadoc(self, doc_id, user_id=None, *args, **kwargs):
    tasks_to_run = []
    with DBSession() as session:
        data_doc = datadoc_logic.get_data_doc_by_id(doc_id, session=session)
        if not data_doc:
            return None

        runner_id = user_id if user_id is not None else data_doc.owner_uid
        query_cells = [
            cell for cell in data_doc.cells if cell.cell_type == DataCellType.query
        ]
        for index, query_cell in enumerate(query_cells):
            query = render_templated_query(query_cell.context, data_doc.meta)
            tasks_to_run.append(
                make_query_execution_task.si(
                    prev_query_status=QueryExecutionStatus.DONE.value,
                    query=query,
                    engine_id=query_cell.meta["engine"],
                    cell_id=query_cell.id,
                    uid=runner_id,
                )
                if index == 0
                else make_query_execution_task.s(
                    query=query,
                    engine_id=query_cell.meta["engine"],
                    cell_id=query_cell.id,
                    uid=runner_id,
                )
            )
            tasks_to_run.append(run_query_task.s())
    chain(*tasks_to_run).apply_async()


@celery.task(bind=True)
def make_query_execution_task(
    self, prev_query_status, query, engine_id, cell_id, uid,
):
    if prev_query_status == QueryExecutionStatus.DONE.value:
        # TODO: add permission check here
        with DBSession() as session:
            query_execution_id = qe_logic.create_query_execution(
                query=query, engine_id=engine_id, uid=uid, session=session
            ).id
            datadoc_logic.append_query_executions_to_data_cell(
                cell_id, [query_execution_id], session=session
            )
            return query_execution_id
    else:
        raise Exception("Last execution did not finish successfully")
