from flask_login import current_user
from typing import List, Optional

from app.db import with_session
from app.datasource import abort_request, api_assert
from const.datasources import (
    ACCESS_RESTRICTED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)

from models.admin import QueryEngine, QueryMetastore, QueryEngineEnvironment
from models.query_execution import QueryExecution, StatementExecution
from models.metastore import DataSchema, DataTable, DataTableColumn
from models.datadoc import DataDoc, DataCell, DataDocDataCell
from logic.query_execution_permission import (
    user_can_access_query_execution,
    get_user_environments_by_execution_id,
)
from logic import query_execution as query_execution_logic
from models.board import Board


def abort_404(message: Optional[str] = None):
    abort_request(status_code=RESOURCE_NOT_FOUND_STATUS_CODE, message=message)


def verify_environment_permission(environment_ids: List[int]):
    # If we are verifying environment ids and none is returned
    # it is most likely that the object we are verifying does
    # not associate with any environment
    if len(environment_ids) == 0:
        abort_404("Requested resource is not available within accessible environment")

    api_assert(
        any(eid in current_user.environment_ids for eid in environment_ids),
        message="Unauthorized Environment",
        status_code=ACCESS_RESTRICTED_STATUS_CODE,
    )


@with_session
def verify_query_engine_environment_permission(
    query_engine_id, environment_id, session=None
):
    api_assert(
        session.query(QueryEngineEnvironment)
        .filter_by(query_engine_id=query_engine_id, environment_id=environment_id)
        .first()
        is not None,
        message="Engine is not in Environment",
        status_code=ACCESS_RESTRICTED_STATUS_CODE,
    )


@with_session
def verify_query_engine_permission(query_engine_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngineEnvironment.environment_id)
        .join(QueryEngine)
        .filter(QueryEngine.id == query_engine_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_query_execution_permission(query_execution_id, session=None):
    user_envs = get_user_environments_by_execution_id(
        query_execution_id, current_user.id, session=session
    )
    verify_environment_permission([e.id for e in user_envs])
    verify_query_execution_access(query_execution_id, user_envs, session=session)


@with_session
def verify_statement_execution_permission(statement_execution_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngineEnvironment.environment_id)
        .join(QueryEngine)
        .join(QueryExecution)
        .join(StatementExecution)
        .filter(StatementExecution.id == statement_execution_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_metastore_permission(metastore_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngineEnvironment.environment_id)
        .join(QueryEngine)
        .join(QueryMetastore)
        .filter(QueryMetastore.id == metastore_id)
    ]
    verify_environment_permission(environment_ids)


@with_session
def verify_data_schema_permission(schema_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngineEnvironment.environment_id)
        .join(QueryEngine)
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
        for eid, in session.query(QueryEngineEnvironment.environment_id)
        .join(QueryEngine)
        .join(QueryMetastore)
        .join(DataSchema)
        .join(DataTable)
        .filter(DataTable.id == table_id)
    ]


@with_session
def verify_data_column_permission(column_id, session=None):
    environment_ids = [
        eid
        for eid, in session.query(QueryEngineEnvironment.environment_id)
        .join(QueryEngine)
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


@with_session
def verify_query_execution_owner(execution_id, session=None):
    execution = query_execution_logic.get_query_execution_by_id(
        execution_id, session=session
    )
    api_assert(
        current_user.id == getattr(execution, "uid", None),
        "Action can only be preformed by execution owner",
    )


@with_session
def verify_query_execution_access(execution_id, user_envs, session=None):
    api_assert(
        # if any env is shareable
        any(e.shareable for e in user_envs)
        # otherwise we have to check if query execution has user
        or user_can_access_query_execution(
            uid=current_user.id,
            execution_id=execution_id,
            session=session,
        ),
        "CANNOT_ACCESS_QUERY_EXECUTION",
        ACCESS_RESTRICTED_STATUS_CODE,
    )


@with_session
def get_board_environment_ids(board_id, session=None):
    return [
        eid for eid, in session.query(Board.environment_id).filter(Board.id == board_id)
    ]
