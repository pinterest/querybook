import hashlib
import time
from flask_login import current_user

from app.db import with_session
from langchain.docstore.document import Document
from lib.ai_assistant import ai_assistant
from lib.elasticsearch.search_table import construct_tables_query_by_table_names
from lib.logger import get_logger
from lib.vector_store import get_vector_store
from logic.admin import get_query_engine_by_id
from logic.metastore import get_all_table, get_table_by_name
from models.metastore import DataTable

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


def get_sample_query_cells_by_table_name(table_name: str, k: int = 50):
    """Get at most 50 sample queries from elasticsearch query_cell index by table name in the past half year."""
    from lib.elasticsearch.search_query import construct_query_search_query
    from lib.elasticsearch.search_utils import get_matching_objects
    from logic.elasticsearch import ES_CONFIG

    # get timestamp of yesterday
    end_time = int(time.time()) - 24 * 60 * 60
    # get timestamp of 6 months ago
    start_time = end_time - 6 * 30 * 24 * 60 * 60

    filters = [
        ["full_table_name", [f"{table_name}"]],
        ["query_type", "query_cell"],
        ["statement_type", ["SELECT"]],
        ["startDate", start_time],
        ["endDate", end_time],
    ]

    query = construct_query_search_query(
        uid=current_user.id if current_user else 1,
        keywords="",
        filters=filters,
        limit=min(
            3 * k, 50
        ),  # fetch 3 times of k queries or at least 50 queries as we'll filter out some
        offset=0,
        sort_key="created_at",
        sort_order="desc",
    )

    index_name = ES_CONFIG["query_cells"]["index_name"]

    results = get_matching_objects(query, index_name, False)
    return [r for r in results if r.get("title") and r.get("title") != "Untitled"][:k]


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
        metastore_id = engine.metastore_id

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
        doc_id = _get_query_doc_id(query_text)
        create_and_store_document(summary, metadata, doc_id)
    except Exception as e:
        print(f"Failed to process query execution: {e}")


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

        sample_query_cells = get_sample_query_cells_by_table_name(full_table_name)

        # ingest table summary
        summary = ai_assistant.summarize_table(
            metastore_id=metastore_id,
            table_name=full_table_name,
            sample_queries=[q["query_text"] for q in sample_query_cells[:5]],
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
    metastore_id,
    keywords,
    filters=None,
):
    """search tables from vector store and return at most 10 results."""
    from lib.elasticsearch.search_utils import get_matching_objects
    from logic.elasticsearch import ES_CONFIG

    # get similar table names from vector store.
    tables = get_vector_store().search_tables(metastore_id, keywords, k=10)
    table_names = [t[0] for t in tables]

    query = construct_tables_query_by_table_names(metastore_id, table_names, filters)
    results = get_matching_objects(query, ES_CONFIG["tables"]["index_name"])

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
