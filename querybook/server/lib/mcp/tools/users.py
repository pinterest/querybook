from typing import Annotated

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.elasticsearch.search_utils import get_matching_suggestions, ES_CONFIG
from lib.elasticsearch.suggest_user import construct_suggest_user_query
from lib.mcp.lib.users import serialize_user, get_user_data
from lib.mcp.utils import READ_ONLY_ANNOTATIONS
from logic.user import get_users_by_ids


def register(mcp: FastMCP) -> None:
    """Register user tools on the given MCP server."""

    @mcp.tool(
        title="Get Current User",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def get_current_user(
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Get the current authenticated user's profile information."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            return get_user_data("me", uid, session)

    @mcp.tool(
        title="Get Users",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def get_users(
        user_ids: Annotated[list[int], "List of user IDs to retrieve, max 100"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """Get user information for multiple user IDs in batch."""
        if len(user_ids) > 100:
            raise ValueError("Requesting too many users (max 100)")
        with DBSession() as session:
            users = get_users_by_ids(user_ids, session=session)
            return [serialize_user(user) for user in users]

    @mcp.tool(
        title="Search Users",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def search_users(
        query: Annotated[str, "Search query to match against username or fullname"],
        limit: Annotated[int, "Maximum number of results"] = 20,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """Search for users by username or fullname with case-insensitive prefix match."""
        if limit > 100:
            raise ValueError("Requesting too many users (max 100)")

        es_query = construct_suggest_user_query(prefix=query, limit=limit)
        options = get_matching_suggestions(es_query, ES_CONFIG["users"]["index_name"])

        users = []
        for option in options:
            user_id = option.get("_source", {}).get("id")
            if user_id:
                users.append(
                    {
                        "id": user_id,
                        "username": option.get("_source", {}).get("username"),
                        "fullname": option.get("_source", {}).get("fullname"),
                        "resource_uri": f"querybook://user/{user_id}",
                    }
                )
        return users
