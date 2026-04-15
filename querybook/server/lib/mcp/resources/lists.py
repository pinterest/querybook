from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.lists import get_list_data
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register list resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://list/{list_id}",
        name="List Content",
        description="Get a single list with its items and editors by ID",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_list_resource(
        list_id: Annotated[int, "List ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a single list with its items and editors."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_list_data(list_id, uid, session)
            return [ResourceContent(result)]
