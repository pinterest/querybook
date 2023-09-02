import hashlib

from app.db import with_session
from const.query_execution import QueryExecutionStatus
from langchain.docstore.document import Document
from lib.ai_assistant import ai_assistant
from lib.logger import get_logger
from lib.vector_store import get_vector_store
from logic.metastore import (
    get_all_table,
    get_table_by_id,
    get_tables_by_query_execution_id,
)
from logic.query_execution import get_query_execution_by_id
from models.metastore import DataTable
from models.query_execution import QueryExecution

LOG = get_logger(__file__)


def generate_hash(query: str) -> str:
    """Normalize SQL query and generate its hash."""
    query = " ".join(query.replace("\n", " ").strip().lower().split())
    query_hash = hashlib.sha256(query.encode())
    return query_hash.hexdigest()


def create_and_store_document(summary: str, metadata: dict, doc_id: str):
    """Create a Document and store it in the vector store."""
    try:
        doc = Document(page_content=summary, metadata=metadata)
        get_vector_store().add_documents(documents=[doc], ids=[doc_id])
    except Exception as e:
        LOG.error(f"Failed to store document to vector store: {e}")
        raise


def _get_table_doc_id(table_id: int) -> str:
    return f"table_{table_id}"


def _get_query_doc_id(query: str) -> str:
    return f"query_{generate_hash(query)}"


@with_session
def record_query_execution(
    query_execution: QueryExecution,
    session=None,
):
    """Generate summary of the query execution and log it to the vector store."""
    # vector store is not configured
    if not get_vector_store():
        return

    if not query_execution:
        return

    try:
        tables = get_tables_by_query_execution_id(query_execution.id, session=session)
        if not tables:
            return

        if get_vector_store().should_skip_query_execution(query_execution, tables):
            return

        summary = ai_assistant.summarize_query(
            table_ids=[t.id for t in tables],
            query=query_execution.query,
            session=session,
        )
        table_names = [f"{t.data_schema.name}.{t.name}" for t in tables]

        metadata = {
            "type": "query",
            "tables": table_names,
            "query": query_execution.query,
            "execution_id": query_execution.id,
        }
        doc_id = _get_query_doc_id(query_execution.query)
        create_and_store_document(summary, metadata, doc_id)
    except Exception as e:
        # will just fail silently to avoid blocking the main process
        LOG.error(f"Failed to log query execution to vector store: {e}")


@with_session
def record_query_execution_by_id(
    query_execution_id: int,
    session=None,
):
    # vector store is not configured
    if not get_vector_store():
        return

    query_execution = get_query_execution_by_id(query_execution_id, session=session)
    record_query_execution(query_execution, session=session)


@with_session
def record_table(
    table: DataTable,
    session=None,
):
    """Generate summary of the table and record it to the vector store."""
    # vector store is not configured
    if not get_vector_store():
        return

    if not table:
        return

    try:
        if get_vector_store().should_skip_table(table):
            return

        summary = ai_assistant.summarize_table(table_id=table.id, session=session)

        full_table_name = f"{table.data_schema.name}.{table.name}"
        metadata = {
            "type": "table",
            "tables": [full_table_name],
            "table_id": table.id,
        }
        doc_id = _get_table_doc_id(table.id)
        create_and_store_document(summary, metadata, doc_id)
    except Exception as e:
        # will just fail silently to avoid blocking the main process
        LOG.error(f"Failed to log table to vector store: {e}")


@with_session
def record_table_by_id(
    table_id: int,
    session=None,
):
    # vector store is not configured
    if not get_vector_store():
        return

    table = get_table_by_id(table_id, session=session)
    record_table(table=table, session=session)


def delete_table_doc(table_id: int):
    """Delete table summary doc from vector store by table id."""

    # vector store is not configured
    if not get_vector_store():
        return
    doc_id = _get_table_doc_id(table_id)
    get_vector_store().delete([doc_id])


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
            full_table_name = f"{table.data_schema.name}.{table.name}"
            print(f"Ingesting table: {full_table_name}")
            record_table(table=table, session=session)

        if len(tables) < batch_size:
            break

        offset += batch_size


@with_session
def ingest_query_executions(batch_size=100, session=None):
    offset = 0

    while True:
        # TODO: there may be many highly similar queries, we should not ingest all of them.
        query_executions = (
            session.query(QueryExecution)
            .filter(QueryExecution.status == QueryExecutionStatus.DONE)
            .offset(offset)
            .limit(batch_size)
            .all()
        )

        for qe in query_executions:
            print(f"Ingesting query execution: {qe.id}")
            record_query_execution(query_execution=qe, session=session)

        if len(query_executions) < batch_size:
            break

        offset += batch_size
