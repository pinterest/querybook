import hashlib
from typing import Optional

from app.db import with_session
from langchain.docstore.document import Document
from lib.ai_assistant import ai_assistant
from lib.logger import get_logger
from lib.vector_store import vector_store
from logic.metastore import get_table_by_id, get_tables_by_query_execution_id
from logic.query_execution import get_query_execution_by_id
from models.metastore import DataTable
from models.query_execution import QueryExecution

LOG = get_logger(__file__)


def generate_hash(query: str) -> str:
    """Normalize SQL query and generate its hash."""
    query = query.replace("\n", " ").strip().lower().split()
    query_hash = hashlib.sha256(query.encode())
    return query_hash.hexdigest()


def create_and_store_document(summary: str, metadata: dict, doc_id: str):
    """Create a Document and store it in the vector store."""
    try:
        doc = Document(page_content=summary, metadata=metadata)
        vector_store.add_documents(documents=[doc], ids=[doc_id])
    except Exception as e:
        LOG.error(f"Failed to store document to vector store: {e}")
        raise


def _get_table_doc_id(table_id: int) -> str:
    return f"table_{table_id}"


def _get_query_doc_id(query: str) -> str:
    return f"query_{generate_hash(query)}"


@with_session
def log_query_execution(
    query_execution_id: Optional[int] = None,
    query_execution: Optional[QueryExecution] = None,
    session=None,
):
    """Generate summary of the query execution and log it to the vector store."""
    try:
        if query_execution is None:
            query_execution = get_query_execution_by_id(
                query_execution_id, session=session
            )

        if not query_execution:
            return

        tables = get_tables_by_query_execution_id(query_execution.id, session=session)
        if not tables:
            return

        if vector_store.should_skip_query_execution(query_execution, tables):
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
def log_table(
    table_id: Optional[int] = None,
    table: Optional[DataTable] = None,
    session=None,
):
    """Generate summary of the table and log it to the vector store."""
    try:
        if table is None:
            table = get_table_by_id(table_id, session=session)

        if table is None:
            return

        if vector_store.should_skip_table(table):
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


def delete_table_doc(table_id: int):
    """Delete table summary doc from vector store by table id."""
    doc_id = _get_table_doc_id(table_id)
    vector_store.delete([doc_id])
