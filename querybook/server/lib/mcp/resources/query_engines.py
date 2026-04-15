from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.query_engines import get_query_engine_data
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register query engine resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://query-engine/{engine_id}",
        name="Query Engine",
        description="Get a single query engine's configuration by ID",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_query_engine_resource(
        engine_id: Annotated[int, "Query engine ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a single query engine's configuration."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_query_engine_data(engine_id, uid, session)
            return [ResourceContent(result)]
