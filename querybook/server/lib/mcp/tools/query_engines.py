from typing import Annotated

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.query_engines import serialize_query_engine
from lib.mcp.utils import READ_ONLY_ANNOTATIONS
from logic import admin as admin_logic
from logic.environment import get_all_accessible_environment_ids_by_uid


def register(mcp: FastMCP) -> None:
    """Register query engine tools on the given MCP server."""

    @mcp.tool(
        title="List Query Engines",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def list_query_engines(
        environment_id: Annotated[int, "Environment ID from list_environments"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """List query engines accessible to the user in the given environment."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            accessible_env_ids = get_all_accessible_environment_ids_by_uid(
                uid, session=session
            )
            if environment_id not in accessible_env_ids:
                raise ValueError(
                    f"You do not have access to environment {environment_id}."
                )
            engines = admin_logic.get_query_engines_by_environment(
                environment_id, ordered=True, session=session
            )
            return [
                serialize_query_engine(engine, with_environments=True)
                for engine in engines
            ]
