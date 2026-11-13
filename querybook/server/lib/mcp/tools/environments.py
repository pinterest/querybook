from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.environments import serialize_environment
from lib.mcp.utils import READ_ONLY_ANNOTATIONS
from logic.environment import get_all_visible_environments_by_uid


def register(mcp: FastMCP) -> None:
    """Register environment tools on the given MCP server."""

    @mcp.tool(
        title="List Environments",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def list_environments(
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """List all environments visible to the authenticated user."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            environments = get_all_visible_environments_by_uid(uid, session=session)
            return [
                serialize_environment(
                    env, uid=uid, session=session, with_query_engines=True
                )
                for env in environments
            ]
