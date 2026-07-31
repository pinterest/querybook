from flask_login import current_user
from typing import List, Optional

from app.db import with_session
from app.datasource import abort_request, api_assert
from const.data_doc import DataCellType
from const.datasources import (
    ACCESS_RESTRICTED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)

from env import QuerybookSettings
from lib.access_control import check_restricted_query_access
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


def verify_every_environment_permission(environment_ids: List[int]):
    """
    Verify that the current user has access to every one of the provided environment ids.

    If the user does not have access to every one of the provided environment ids,
    the function will abort the request with a 403 error.
    """
    verify_safe_environment_access(environment_ids)
    if len(environment_ids) == 0:
        abort_404("Requested resource is not available within accessible environment")

    api_assert(
        all(eid in current_user.environment_ids for eid in environment_ids),
        message="Unauthorized Environment",
        status_code=ACCESS_RESTRICTED_STATUS_CODE,
    )


def verify_environment_permission(environment_ids: List[int]):
    """
    Verify that the current user has access to at least one of the provided environment ids.

    If the user does not have access to any of the provided environment ids,
    the function will abort the request with a 403 error.
    """
    # If we are verifying environment ids and none is returned
    # it is most likely that the object we are verifying does
    # not associate with any environment
    verify_safe_environment_access(environment_ids)
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


def verify_safe_environment_access(environment_ids: List[int]):
    # If safe_environments is empty or the environment ids are safe, we can return early
    safe_environments = QuerybookSettings.SAFE_ENVIRONMENTS
    if not safe_environments or any(
        environment_id in safe_environments for environment_id in environment_ids
    ):
        return

    # Check that the environment access is not restricted
    api_assert(
        check_restricted_query_access(),
        message=f"Environment ids '{str(environment_ids)}' are not allowed for this request.",
        status_code=ACCESS_RESTRICTED_STATUS_CODE,
    )


def verify_safe_query_engine_access(query_engine_ids: List[int]):
    # If safe_query_engines is empty or the query engine ids are safe, we can return early
    safe_query_engines = QuerybookSettings.SAFE_QUERY_ENGINES
    if not safe_query_engines or all(
        query_engine_id in safe_query_engines for query_engine_id in query_engine_ids
    ):
        return

    # Check that the query engine access is not restricted
    api_assert(
        check_restricted_query_access(),
        message=f"Query engine ids '{str(query_engine_ids)}' are not allowed for this request.",
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
    verify_safe_query_engine_access([query_engine_id])
    verify_environment_permission(environment_ids)


@with_session
def verify_query_execution_permission(query_execution_id, session=None):
    user_envs = get_user_environments_by_execution_id(
        query_execution_id, current_user.id, session=session
    )
    verify_environment_permission([e.id for e in user_envs])
    verify_query_execution_access(query_execution_id, user_envs, session=session)

    query_engine_ids = [
        qeid
        for qeid, in session.query(QueryEngine.id)
        .join(QueryExecution)
        .filter(QueryExecution.id == query_execution_id)
    ]
    verify_safe_query_engine_access(query_engine_ids)


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
    query_engine_ids = [
        qeid
        for qeid, in session.query(QueryEngine.id)
        .join(QueryExecution)
        .join(StatementExecution)
        .filter(StatementExecution.id == statement_execution_id)
    ]
    verify_safe_query_engine_access(query_engine_ids)


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
    query_engine_ids = get_query_engine_ids_by_data_doc_id(data_doc_id, session=session)
    verify_safe_query_engine_access(query_engine_ids)


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

    engine_ids = get_query_engine_ids_by_data_cell_ids([cell_id], session=session)
    verify_safe_query_engine_access(engine_ids)


@with_session
def verify_data_cells_permission(cell_ids: List, session=None):
    environment_ids = [
        eid
        for eid, in session.query(DataDoc.environment_id)
        .join(DataDocDataCell)
        .join(DataCell)
        .filter(DataCell.id.in_(cell_ids))
    ]
    verify_every_environment_permission(environment_ids)
    engine_ids = get_query_engine_ids_by_data_cell_ids(cell_ids, session=session)
    verify_safe_query_engine_access(engine_ids)


def get_engine_ids_by_data_cells(data_cells: List[DataCell]):
    engine_ids = set()
    for cell in data_cells:
        if cell.meta and isinstance(cell.meta, dict):
            engine_id = cell.meta.get("engine")
            if engine_id is not None:
                engine_ids.add(engine_id)
    return list(engine_ids)


@with_session
def get_query_engine_ids_by_data_cell_ids(data_cell_ids: List[int], session=None):
    """
    Get query engine id(s) from a data cell.
    Returns a list of engine ids.
    Returns empty list if cell doesn't exist or is not a query cell or has no engine in meta.
    """
    data_cells = session.query(DataCell).filter(DataCell.id.in_(data_cell_ids)).all()
    return get_engine_ids_by_data_cells(data_cells)


@with_session
def get_query_engine_ids_by_data_doc_id(data_doc_id, session=None):
    """
    Get all query engine ids from all query cells in a data doc.
    Returns a list of unique engine ids.
    Returns empty list if doc doesn't exist or has no query cells with engines.
    """
    data_doc = session.query(DataDoc).filter(DataDoc.id == data_doc_id).first()
    if not data_doc:
        return []

    query_cells = [
        cell for cell in data_doc.cells if cell.cell_type == DataCellType.query
    ]

    return get_engine_ids_by_data_cells(query_cells)


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
