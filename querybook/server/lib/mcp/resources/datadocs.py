from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.datadocs import (
    get_datadoc_data,
    get_datadoc_cell_data,
    get_datadoc_cell_executions_data,
)
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register datadoc resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://datadoc/{datadoc_id}",
        name="DataDoc Content",
        description="Get a single DataDoc with its cells and editors by ID",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_datadoc_resource(
        datadoc_id: Annotated[int, "DataDoc ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a single DataDoc with its cells and editors."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_datadoc_data(datadoc_id, uid, session)
            return [ResourceContent(result)]

    @mcp.resource(
        uri="querybook://datadoc-cell/{cell_id}",
        name="DataDoc Cell",
        description="Get a single DataDoc cell with its content and metadata",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_datadoc_cell_resource(
        cell_id: Annotated[int, "DataDoc cell ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a single DataDoc cell."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_datadoc_cell_data(cell_id, uid, session)
            return [ResourceContent(result)]

    @mcp.resource(
        uri="querybook://datadoc-cell/{cell_id}/executions{?limit,offset}",
        name="DataDoc Cell Executions",
        description="Get query executions for a DataDoc cell with pagination",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_datadoc_cell_executions_resource(
        cell_id: Annotated[int, "DataDoc cell ID"],
        limit: Annotated[int, "Maximum number of results"] = 20,
        offset: Annotated[int, "Pagination offset"] = 0,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get execution history for a DataDoc cell."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_datadoc_cell_executions_data(
                cell_id, uid, session, limit, offset
            )
            return [ResourceContent({"executions": result})]
