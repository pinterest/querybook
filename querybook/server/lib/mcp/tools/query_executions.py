from typing import Annotated, Literal

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from const.query_execution import QueryExecutionStatus, QueryExecutionType
from lib.mcp.lib.query_executions import (
    serialize_query_execution,
    serialize_query_execution_summary,
)
from lib.mcp.utils import (
    CREATE_ANNOTATIONS,
    READ_ONLY_ANNOTATIONS,
    verify_query_engine_access,
)
from lib.query_analysis.templating import render_templated_query
from logic import query_execution as logic
from logic import datadoc as datadoc_logic
from logic.datadoc_permission import user_can_write, DocDoesNotExist


def _build_mcp_metadata(user_metadata: dict | None) -> dict:
    """Build execution metadata with MCP source marker."""
    metadata = dict(user_metadata) if user_metadata else {}
    metadata["source"] = "mcp"
    return metadata


def register(mcp: FastMCP) -> None:
    """Register query execution tools on the given MCP server."""

    @mcp.tool(
        title="List Query Executions",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def list_query_executions(
        environment_id: Annotated[int, "Environment ID from list_environments"],
        engine_id: Annotated[
            int | None,
            "Filter by query engine ID from list_query_engines",
        ] = None,
        status: Annotated[
            Literal[
                "INITIALIZED",
                "DELIVERED",
                "RUNNING",
                "DONE",
                "ERROR",
                "CANCEL",
                "PENDING_REVIEW",
                "REJECTED",
            ]
            | None,
            "Filter by execution status",
        ] = None,
        running: Annotated[
            bool | None,
            "If true, show only active executions (INITIALIZED, DELIVERED, RUNNING)",
        ] = None,
        limit: Annotated[int, "Maximum results, max 100"] = 20,
        offset: Annotated[int, "Pagination offset"] = 0,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """List query executions for the current user. Returns summaries only."""
        if limit > 100:
            raise ValueError("limit must be 100 or less")

        uid = token.claims["creator_uid"]

        filters = {"user": uid}
        if engine_id is not None:
            filters["engine"] = engine_id
        if status is not None:
            filters["status"] = QueryExecutionStatus[status].value
        if running:
            filters["running"] = True

        with DBSession() as session:
            executions = logic.search_query_execution(
                environment_id=environment_id,
                filters=filters,
                orderBy="created_at",
                limit=limit,
                offset=offset,
                session=session,
            )
            return [serialize_query_execution_summary(e) for e in executions]

    @mcp.tool(
        title="Run DataDoc Cell",
        annotations=CREATE_ANNOTATIONS,
    )
    def run_datadoc_cell(
        cell_id: Annotated[int, "Cell ID from get_datadoc"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Execute a query cell from a DataDoc. Returns the query execution ID."""
        uid = token.claims["creator_uid"]

        with DBSession() as session:
            # Get the cell and verify it's a query cell
            cell = datadoc_logic.get_data_cell_by_id(cell_id, session=session)
            if not cell:
                raise ValueError(f"Cell {cell_id} not found.")

            if cell.cell_type.name != "query":
                raise ValueError(
                    f"Cell {cell_id} is not a query cell (type: {cell.cell_type.name})."
                )

            # Check write permission on the parent datadoc (required to execute)
            data_doc = cell.doc
            try:
                if not user_can_write(data_doc.id, uid, session=session):
                    raise ValueError(
                        "You do not have permission to execute this DataDoc."
                    )
            except DocDoesNotExist:
                raise ValueError(f"DataDoc {data_doc.id} not found.")

            # Get engine_id from cell metadata
            engine_id = cell.meta.get("engine")
            if not engine_id:
                raise ValueError("Cell does not have an engine specified.")

            # Verify engine permission (matches REST API's verify_query_engine_permission)
            verify_query_engine_access(engine_id, uid, session)

            # Render query with datadoc variables
            query = render_templated_query(
                cell.context,
                data_doc.meta_variables,
                engine_id,
                session=session,
            )

            # Create and run the query execution
            query_execution = logic.create_query_execution(
                query=query,
                engine_id=engine_id,
                uid=uid,
                status=QueryExecutionStatus.INITIALIZED,
                session=session,
            )

            # Mark execution as originating from MCP
            logic.create_query_execution_metadata(
                query_execution.id, _build_mcp_metadata(None), session=session
            )

            # Associate with the data cell
            datadoc_logic.append_query_executions_to_data_cell(
                cell_id, [query_execution.id], session=session
            )

            # Initiate execution (this queues it for processing)
            from datasources.query_execution import initiate_query_execution

            initiate_query_execution(
                query_execution=query_execution,
                uid=uid,
                peer_review_params=None,
                session=session,
            )

            return serialize_query_execution(query_execution)

    @mcp.tool(
        title="Run DataDoc",
        annotations=CREATE_ANNOTATIONS,
    )
    def run_datadoc(
        datadoc_id: Annotated[int, "DataDoc ID"],
        start_index: Annotated[int, "Index of first cell to execute (0-based)"] = 0,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Execute all query cells in a DataDoc starting from start_index, runs asynchronously via Celery."""
        uid = token.claims["creator_uid"]

        with DBSession() as session:
            # Check write permission (required to execute)
            try:
                if not user_can_write(datadoc_id, uid, session=session):
                    raise ValueError(
                        "You do not have permission to execute this DataDoc."
                    )
            except DocDoesNotExist:
                raise ValueError(f"DataDoc {datadoc_id} not found.")

            # Send Celery task to run the datadoc
            from app.flask_app import celery

            celery.send_task(
                "tasks.run_datadoc.run_datadoc",
                args=[],
                kwargs={
                    "doc_id": datadoc_id,
                    "start_index": start_index,
                    "user_id": uid,
                    "execution_type": QueryExecutionType.ADHOC.value,
                    "notifications": [],
                    "metadata": {"source": "mcp"},
                },
            )

            return {
                "datadoc_id": datadoc_id,
                "datadoc_resource_uri": f"querybook://datadoc/{datadoc_id}",
                "start_index": start_index,
                "message": "DataDoc execution queued. Use get_datadoc_cell_executions to check progress.",
            }

    @mcp.tool(
        title="Execute Ad-Hoc Query",
        annotations=CREATE_ANNOTATIONS,
    )
    def execute_ad_hoc_query(
        query: Annotated[str, "SQL query to execute"],
        engine_id: Annotated[int, "Query engine ID from list_query_engines"],
        metadata: Annotated[dict | None, "Optional metadata for the execution"] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Execute an ad-hoc SQL query without creating a DataDoc. Returns execution details with query_execution_resource_uri for polling and results_resource_uri for each statement."""
        uid = token.claims["creator_uid"]

        with DBSession() as session:
            # Verify engine permission
            verify_query_engine_access(engine_id, uid, session)

            # Create query execution
            query_execution = logic.create_query_execution(
                query=query,
                engine_id=engine_id,
                uid=uid,
                status=QueryExecutionStatus.INITIALIZED,
                session=session,
            )

            # Always create metadata with MCP source marker
            mcp_metadata = _build_mcp_metadata(metadata)
            logic.create_query_execution_metadata(
                query_execution.id, mcp_metadata, session=session
            )

            # Initiate execution (queues to Celery)
            from datasources.query_execution import initiate_query_execution

            initiate_query_execution(
                query_execution=query_execution,
                uid=uid,
                peer_review_params=None,
                session=session,
            )

            return serialize_query_execution(query_execution)
