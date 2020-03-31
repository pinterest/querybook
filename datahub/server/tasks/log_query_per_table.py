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


@celery.task
def log_query_per_table_task(query_execution_id):
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
        table_per_statement, _ = process_query(query_execution.query)

        sync_table_to_metastore(
            table_per_statement, statement_types, metastore_id, session=session
        )

        datadoc_cell = next(iter(query_execution.cells), None)
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


@with_session
def sync_table_to_metastore(
    table_per_statement, statement_types, metastore_id, session=None
):
    metastore_loader = get_metastore_loader(metastore_id, session=session)
    assert metastore_loader is not None

    tables_to_add = set()
    tables_to_remove = set()
    for tables, statement_type in zip(table_per_statement, statement_types):
        if statement_type == "DROP":
            for table in tables:
                tables_to_add.discard(table)
                tables_to_remove.add(table)
        elif statement_type is not None:  # Any other DML/DDL
            for table in tables:
                tables_to_remove.discard(table)

                # If table is create or alert, we must update metastore
                if table not in tables_to_add:  # This is to minimize the checks
                    if statement_type in ("CREATE", "ALTER"):
                        tables_to_add.add(table)
                    else:
                        # Otherwise for things like insert/select we only update
                        # if it doesn't exist in the metastore
                        schema_name, table_name = table.split(".")
                        query_table = m_logic.get_table_by_name(
                            schema_name,
                            table_name,
                            metastore_id=metastore_id,
                            session=session,
                        )
                        if not query_table:
                            tables_to_add.add(table)

    for table in tables_to_remove:
        schema_name, table_name = table.split(".")
        metastore_loader.sync_delete_table(schema_name, table_name, session=session)

    for table in tables_to_add:
        schema_name, table_name = table.split(".")
        metastore_loader.sync_create_or_update_table(
            schema_name, table_name, session=session
        )


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
            m_logic.delete_old_able_query_execution_log(
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
