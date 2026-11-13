from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.users import get_user_data
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register user resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://user/{user_id}",
        name="User Profile",
        description="Get a single user's profile information by ID or 'me' for current user",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_user_resource(
        user_id: Annotated[int | str, "User ID or 'me' for current user"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a single user's profile information."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_user_data(user_id, uid, session)
            return [ResourceContent(result)]
