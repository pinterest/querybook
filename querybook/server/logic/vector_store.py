from app.db import with_session
from const.ai_assistant import (
    DEFAUTL_TABLE_SEARCH_LIMIT,
    MAX_SAMPLE_QUERY_COUNT_FOR_TABLE_SUMMARY,
)
from langchain.docstore.document import Document
from lib.ai_assistant import ai_assistant
from lib.elasticsearch.search_table import construct_tables_query_by_table_names
from lib.elasticsearch.search_utils import ES_CONFIG, get_matching_objects
from lib.logger import get_logger
from lib.vector_store import get_vector_store
from logic.admin import get_query_engine_by_id
from logic.elasticsearch import get_sample_query_cells_by_table_name
from logic.metastore import get_all_table, get_table_by_name
from models.metastore import DataTable

LOG = get_logger(__file__)


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


def _get_query_doc_id(query_cell_id: int) -> str:
    return f"query_{query_cell_id}"


@with_session
def record_query_cell_from_es(
    es_query_cell: dict,
    session=None,
):
    """Log elastic search query cell object to the vector store."""
    # vector store is not configured
    if not get_vector_store():
        return

    # skip if title is empty or "Untitled"
    if (
        not es_query_cell
        or not es_query_cell["title"]
        or es_query_cell["title"] == "Untitled"
    ):
        return

    try:
        engine_id = es_query_cell["engine_id"]
        engine = get_query_engine_by_id(engine_id, session=session)
        if not engine:
            LOG.warning(f"Engine {engine_id} not found.")
            return

        metastore_id = engine.metastore_id
        if not metastore_id:
            LOG.warning(f"Engine {engine_id} does not have metastore.")
            return

        query_text = es_query_cell["query_text"]
        table_names = es_query_cell["full_table_name"]
        summary = ai_assistant.summarize_query(
            metastore_id=metastore_id,
            table_names=table_names,
            query=query_text,
            session=session,
        )
        metadata = {
            "type": "query",
            "tables": table_names,
            "query": query_text,
            "query_cell_id": es_query_cell["id"],
            "metastore_id": metastore_id,
        }
        doc_id = _get_query_doc_id(es_query_cell["id"])
        create_and_store_document(summary, metadata, doc_id)
    except Exception as e:
        LOG.error(f"Failed to process sample query cell: {e}")


@with_session
def record_table(
    table: DataTable,
    ingest_sample_queries: bool = False,
    session=None,
):
    """Generate summary of the table and record it to the vector store."""
    # vector store is not configured
    if not get_vector_store():
        LOG.warning("Vector store is not configured.")
        return

    if not table:
        return

    try:
        if get_vector_store().should_skip_table(table):
            return

        metastore_id = table.data_schema.metastore_id
        full_table_name = f"{table.data_schema.name}.{table.name}"

        sample_query_cells = get_sample_query_cells_by_table_name(
            table_name=full_table_name
        )

        # ingest table summary
        summary = ai_assistant.summarize_table(
            metastore_id=metastore_id,
            table_name=full_table_name,
            sample_queries=[
                q["query_text"]
                for q in sample_query_cells[:MAX_SAMPLE_QUERY_COUNT_FOR_TABLE_SUMMARY]
            ],
            session=session,
        )

        metadata = {
            "type": "table",
            "tables": [full_table_name],
            "table_ids": [table.id],
            "metastore_id": metastore_id,
        }
        doc_id = _get_table_doc_id(table.id)
        create_and_store_document(summary, metadata, doc_id)

        # ingest sample queries summary
        if ingest_sample_queries:
            for query_cell in sample_query_cells:
                LOG.info(f"Ingesting sample query cell: {query_cell}")
                record_query_cell_from_es(es_query_cell=query_cell, session=session)

    except Exception as e:
        # will just fail silently to avoid blocking the main process
        LOG.error(f"Failed to log table to vector store: {e}")


def delete_table_doc(table_id: int):
    """Delete table summary doc from vector store by table id."""

    # vector store is not configured
    if not get_vector_store():
        return
    doc_id = _get_table_doc_id(table_id)
    get_vector_store().delete([doc_id])


def search_tables(
    metastore_id, keywords, filters=None, limit=DEFAUTL_TABLE_SEARCH_LIMIT
):
    """search tables from vector store and get the table details from elastic search."""

    # get similar table names from vector store.
    tables = get_vector_store().search_tables(metastore_id, keywords, k=limit)
    table_names = [t[0] for t in tables]

    # get those tables from elastic table search index by table name for table details
    query = construct_tables_query_by_table_names(
        metastore_id, table_names, filters, limit=limit
    )
    results = get_matching_objects(query, ES_CONFIG["tables"]["index_name"])

    # reorder the results by the order of table names returned from vector store
    name_to_doc = {r["full_name"]: r for r in results}
    sorted_docs = [name_to_doc[t[0]] for t in tables if t[0] in name_to_doc]

    return {"count": len(sorted_docs), "results": sorted_docs}


@with_session
def get_table_summary_by_name(
    metastore_id: int, full_table_name: str, session=None
) -> str:
    # vector store is not configured
    if not get_vector_store():
        return ""

    table_schema, table_name = full_table_name.split(".")
    table = get_table_by_name(
        schema_name=table_schema,
        name=table_name,
        metastore_id=metastore_id,
        session=session,
    )
    return get_vector_store().get_table_summary(table.id)


@with_session
def ingest_vector_index(batch_size=100, session=None):
    """It will ingest all tables and some sample queries of the tables into the vector store."""
    offset = 0

    while True:
        tables = get_all_table(
            limit=batch_size,
            offset=offset,
            session=session,
        )

        for table in tables:
            full_table_name = f"{table.data_schema.name}.{table.name}"
            LOG.info(f"Ingesting table: {full_table_name}")
            record_table(table=table, ingest_sample_queries=True, session=session)

        if len(tables) < batch_size:
            break

        offset += batch_size
