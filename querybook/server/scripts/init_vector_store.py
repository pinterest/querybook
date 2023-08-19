from app.db import with_session
from const.query_execution import QueryExecutionStatus
from logic.metastore import get_all_table
from logic.vector_store import log_query_execution, log_table
from models.query_execution import QueryExecution


@with_session
def ingest_tables(batch_size=100, session=None):
    offset = 0

    while True:
        tables = get_all_table(
            limit=batch_size,
            offset=offset,
            session=session,
        )

        for table in tables:
            log_table(table=table, session=session)

        if len(tables) < batch_size:
            break

        offset += batch_size


@with_session
def ingest_query_executions(batch_size=100, session=None):
    offset = 0

    while True:
        query_executions = (
            session.query(QueryExecution)
            .filter(QueryExecution.status == QueryExecutionStatus.DONE)
            .offset(offset)
            .limit(batch_size)
            .all()
        )

        for qe in query_executions:
            log_query_execution(query_execution=qe, session=session)

        if len(query_executions) < batch_size:
            break

        offset += batch_size
