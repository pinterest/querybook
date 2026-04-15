from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.environments import get_environment_data
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register environment resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://environment/{environment_id}",
        name="Environment",
        description="Get a single environment's details by ID",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_environment_resource(
        environment_id: Annotated[int, "Environment ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a single environment's details."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_environment_data(environment_id, uid, session)
            return [ResourceContent(result)]
