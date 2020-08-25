from flask_login import current_user
from typing import List

from app.db import with_session
from app.datasource import abort_request, api_assert
from const.datasources import (
    ACCESS_RESTRICTED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)
from logic import admin as admin_logic
from models.admin import QueryEngine, QueryMetastore
from models.query_execution import QueryExecution, StatementExecution
from models.metastore import DataSchema, DataTable, DataTableColumn
from models.datadoc import DataDoc, DataCell, DataDocDataCell
from logic.query_execution_permission import verify_query_execution_access


def abort_404():
    abort_request(status_code=RESOURCE_NOT_FOUND_STATUS_CODE)


def verify_environment_permission(environment_ids: List[int]):
    api_assert(
        any(eid in current_user.environment_ids for eid in environment_ids),
        message="Unauthorized Environment",
        status_code=ACCESS_RESTRICTED_STATUS_CODE,
    )


@with_session
def verify_query_engine_permission(query_engine_id, session=None):
    query_engine = admin_logic.get_query_engine_by_id(query_engine_id, session=session)
    if not query_engine:
        abort_404()
    verify_environment_permission([query_engine.environment_id])


@with_session
def verify_query_execution_permission(query_execution_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngine.environment_id)
        .join(QueryExecution)
        .filter(QueryExecution.id == query_execution_id)
    ]
    verify_environment_permission(environment_ids)
    verify_query_execution_access(query_execution_id)


@with_session
def verify_statement_execution_permission(statement_execution_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngine.environment_id)
        .join(QueryExecution)
        .join(StatementExecution)
        .filter(StatementExecution.id == statement_execution_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_metastore_permission(metastore_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngine.environment_id)
        .join(QueryMetastore)
        .filter(QueryMetastore.id == metastore_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_data_schema_permission(schema_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngine.environment_id)
        .join(QueryMetastore)
        .join(DataSchema)
        .filter(DataSchema.id == schema_id)
    ]

    verify_environment_permission(environment_ids)


@with_session
def verify_data_table_permission(table_id, session=None):
    environment_ids = get_data_table_environment_ids(table_id, session=session)
    verify_environment_permission(environment_ids)


@with_session
def get_data_table_environment_ids(table_id, session=None):
    return [
        eid
        for eid, in session.query(QueryEngine.environment_id)
        .join(QueryMetastore)
        .join(DataSchema)
        .join(DataTable)
        .filter(DataTable.id == table_id)
    ]


@with_session
def verify_data_column_permission(column_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngine.environment_id)
        .join(QueryMetastore)
        .join(DataSchema)
        .join(DataTable)
        .join(DataTableColumn)
        .filter(DataTableColumn.id == column_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_data_doc_permission(data_doc_id, session=None):
    environment_ids = get_data_doc_environment_ids(data_doc_id, session=session)
    verify_environment_permission(environment_ids)


@with_session
def get_data_doc_environment_ids(data_doc_id, session=None):
    return [
        eid
        for eid, in session.query(DataDoc.environment_id).filter(
            DataDoc.id == data_doc_id
        )
    ]


@with_session
def verify_data_cell_permission(cell_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(DataDoc.environment_id)
        .join(DataDocDataCell)
        .join(DataCell)
        .filter(DataCell.id == cell_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_data_cells_permission(cell_ids: List, session=None):
    environment_ids = [
        eid
        for eid, in session.query(DataDoc.environment_id)
        .join(DataDocDataCell)
        .join(DataCell)
        .filter(DataCell.id.in_(cell_ids))
    ]
    verify_environment_permission(environment_ids)
