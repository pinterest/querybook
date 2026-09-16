from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.config import get_config_value
from lib.mcp.utils import RESOURCE_ANNOTATIONS
from lib.result_store import GenericReader
from logic import query_execution as logic
from logic.query_execution_permission import (
    get_user_environments_by_execution_id,
    user_can_access_query_execution,
)

QUERY_RESULT_LIMIT_CONFIG = get_config_value("query_result_limit")


def register(mcp: FastMCP) -> None:
    """Register statement execution resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://statement-execution/{statement_execution_id}/results{?limit}",
        name="Statement Execution Results",
        description="Get the actual result data rows for a statement execution",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_statement_execution_results_resource(
        statement_execution_id: Annotated[int, "Statement execution ID"],
        limit: Annotated[
            int | None,
            f"Maximum number of rows to return (default: {QUERY_RESULT_LIMIT_CONFIG['default_query_result_size']})",
        ] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get the actual result data rows for a statement execution."""
        uid = token.claims["creator_uid"]

        # Apply limits
        if limit is None:
            limit = QUERY_RESULT_LIMIT_CONFIG["default_query_result_size"]

        max_limit = QUERY_RESULT_LIMIT_CONFIG["query_result_size_options"][-1]
        if limit > max_limit:
            raise ValueError(f"Too many rows requested. Maximum is {max_limit}")

        with DBSession() as session:
            statement_execution = logic.get_statement_execution_by_id(
                statement_execution_id, session=session
            )

            if statement_execution is None:
                raise ValueError(
                    f"Statement execution {statement_execution_id} not found."
                )

            # Check permissions on the parent query execution
            query_execution_id = statement_execution.query_execution_id
            user_envs = get_user_environments_by_execution_id(
                query_execution_id, uid, session=session
            )

            # User must either be in a shareable environment or have explicit access
            has_env_access = len(user_envs) > 0 and any(e.shareable for e in user_envs)
            has_execution_access = user_can_access_query_execution(
                uid=uid,
                execution_id=query_execution_id,
                session=session,
            )

            if not (has_env_access or has_execution_access):
                raise ValueError(
                    "You do not have permission to access this query execution."
                )

            # Read result data
            # Check if result_path exists (can be None for failed queries)
            if statement_execution.result_path is None:
                return [ResourceContent({"columns": [], "data": []})]

            try:
                with GenericReader(statement_execution.result_path) as reader:
                    rows = reader.read_csv(number_of_lines=limit + 1)

                    if not rows:
                        return [ResourceContent({"columns": [], "data": []})]

                    return [
                        ResourceContent(
                            {
                                "columns": rows[0] if len(rows) > 0 else [],
                                "data": rows[1:] if len(rows) > 1 else [],
                            }
                        )
                    ]
            except Exception as e:
                raise ValueError(f"Failed to read result data: {str(e)}")
