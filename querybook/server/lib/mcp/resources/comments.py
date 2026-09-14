from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.comments import get_comment_data, get_datadoc_cell_comments_data
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register comment resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://comment/{comment_id}",
        name="Comment Content",
        description="Get a comment with its thread replies and reactions",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_comment_resource(
        comment_id: Annotated[int, "Comment ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get a comment with its thread replies and reactions."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_comment_data(comment_id, uid, session)
            return [ResourceContent(result)]

    @mcp.resource(
        uri="querybook://datadoc-cell/{cell_id}/comments{?include_threads}",
        name="DataDoc Cell Comments",
        description="Get all comments for a DataDoc cell with optional thread replies",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_datadoc_cell_comments_resource(
        cell_id: Annotated[int, "DataDoc cell ID"],
        include_threads: Annotated[bool, "Include thread replies"] = True,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get comments for a DataDoc cell."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_datadoc_cell_comments_data(
                cell_id, uid, include_threads, session
            )
            return [ResourceContent({"comments": result})]
