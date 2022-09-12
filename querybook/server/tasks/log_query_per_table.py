from app.flask_app import celery

from app.db import DBSession, with_session
from const.query_execution import QueryExecutionStatus
from lib.query_analysis.lineage import (
    process_query,
    get_table_statement_type,
)
from lib.metastore import get_metastore_loader
from logic import (
    query_execution as qe_logic,
    metastore as m_logic,
)
from lib.lineage.utils import lineage as lineage_logic


@celery.task(bind=True)
def log_query_per_table_task(self, query_execution_id):
    with DBSession() as session:
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        assert query_execution.status == QueryExecutionStatus.DONE
        metastore_id = query_execution.engine.metastore_id
        if metastore_id is None:
            # This query engine has no metastore configured
            return

        statement_types = get_table_statement_type(query_execution.query)
        table_per_statement, _ = process_query(
            query_execution.query, query_execution.engine.language
        )

        sync_table_to_metastore(
            table_per_statement, statement_types, metastore_id, session=session
        )

        datadoc_cell = next(iter(query_execution.cells), None)
        if any(statement in statement_types for statement in ["CREATE", "INSERT"]):
            create_lineage_from_query(
                query_execution, metastore_id, datadoc_cell, session=session
            )
        if datadoc_cell is None or not datadoc_cell.doc.public:
            return

        log_table_per_statement(
            table_per_statement,
            statement_types,
            query_execution_id,
            metastore_id,
            datadoc_cell.id,
            session=session,
        )


def create_lineage_from_query(
    query_execution, metastore_id, datadoc_cell=None, session=None
):
    cell_title = (
        datadoc_cell.meta["title"]
        if (datadoc_cell and "title" in datadoc_cell.meta)
        else "Untitled"
    )
    job_name = "{}-{}".format(cell_title, query_execution.id)
    data_job_metadata = m_logic.create_job_metadata_row(
        job_name,
        metastore_id,
        job_info={"query_execution_id": query_execution.id},
        job_owner=query_execution.owner.username,
        query_text=query_execution.query,
        is_adhoc=True,
        session=session,
    )
    lineage_logic.create_table_lineage_from_metadata(
        data_job_metadata.id, query_execution.engine.language, session=session
    )


@with_session
def sync_table_to_metastore(
    table_per_statement, statement_types, metastore_id, session=None
):
    """Sync tables with metastore. Tables are parsed from executed queries.

    It syncs below two kinds of tables:
        - tables from CREATE, ALTER, DROP statements.
        - tables from other statements, but they dont exsit in Querybook database.
    """
    metastore_loader = get_metastore_loader(metastore_id, session=session)
    assert metastore_loader is not None

    tables_to_sync = set()
    for tables, statement_type in zip(table_per_statement, statement_types):
        if statement_type in ("CREATE", "ALTER", "DROP"):
            for table in tables:
                tables_to_sync.add(table)
        elif statement_type is not None:
            # Otherwise for things like insert/select we only update
            # if it doesn't exist in the Querybook database
            for table in tables:
                if table not in tables_to_sync:
                    schema_name, table_name = table.split(".")
                    query_table = m_logic.get_table_by_name(
                        schema_name,
                        table_name,
                        metastore_id=metastore_id,
                        session=session,
                    )
                    if not query_table:
                        tables_to_sync.add(table)

    for table in tables_to_sync:
        schema_name, table_name = table.split(".")
        metastore_loader.sync_table(schema_name, table_name, session=session)


@with_session
def log_table_per_statement(
    table_per_statement,
    statement_types,
    query_execution_id,
    metastore_id,
    cell_id,
    session=None,
):
    metastore_loader = get_metastore_loader(metastore_id, session=session)
    assert metastore_loader is not None

    all_tables = set()
    # Only show example queries of SELECT statements
    for tables, statement_type in zip(table_per_statement, statement_types):
        if statement_type in ("SELECT", "INSERT"):
            all_tables.update(tables)

    for table in all_tables:
        schema_name, table_name = table.split(".")
        query_table = m_logic.get_table_by_name(
            schema_name, table_name, metastore_id=metastore_id, session=session
        )

        if query_table:  # Sanity check
            m_logic.delete_old_table_query_execution_log(
                cell_id=cell_id,
                query_execution_id=query_execution_id,
                commit=False,
                session=session,
            )
            m_logic.create_table_query_execution_log(
                table_id=query_table.id,
                cell_id=cell_id,
                query_execution_id=query_execution_id,
                session=session,
            )
