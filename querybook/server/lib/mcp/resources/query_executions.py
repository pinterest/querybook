from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.query_executions import serialize_query_execution
from lib.mcp.utils import RESOURCE_ANNOTATIONS
from logic import query_execution as logic
from logic.query_execution_permission import user_can_access_query_execution


def register(mcp: FastMCP) -> None:
    """Register query execution resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://query-execution/{query_execution_id}",
        name="Query Execution",
        description="Get query execution status and statement details",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_query_execution_resource(
        query_execution_id: Annotated[int, "Query execution ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get query execution status and statement details."""
        uid = token.claims["creator_uid"]

        with DBSession() as session:
            execution = logic.get_query_execution_by_id(
                query_execution_id, session=session
            )

            if not execution:
                raise ValueError(f"Query execution {query_execution_id} not found.")

            # Check permissions
            has_execution_access = user_can_access_query_execution(
                uid=uid,
                execution_id=query_execution_id,
                session=session,
            )

            if not has_execution_access:
                raise ValueError(
                    "You do not have permission to access this query execution."
                )

            return [ResourceContent(serialize_query_execution(execution))]
