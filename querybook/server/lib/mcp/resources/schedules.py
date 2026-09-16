from typing import Annotated

from fastmcp import FastMCP
from fastmcp.resources import ResourceContent
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.schedules import get_schedule_data, get_schedule_runs_data
from lib.mcp.utils import RESOURCE_ANNOTATIONS


def register(mcp: FastMCP) -> None:
    """Register schedule resources on the given MCP server."""

    @mcp.resource(
        uri="querybook://schedule/{schedule_id}",
        name="Schedule Details",
        description="Get a single schedule with its run history",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_schedule_resource(
        schedule_id: Annotated[int, "Schedule ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get schedule details with recent run history."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_schedule_data(schedule_id, uid, session)
            return [ResourceContent(result)]

    @mcp.resource(
        uri="querybook://schedule/{schedule_id}/runs{?limit,offset,hide_successful}",
        name="Schedule Run History",
        description="Get execution history for a schedule with optional filtering and pagination",
        mime_type="application/json",
        annotations=RESOURCE_ANNOTATIONS,
    )
    def get_schedule_runs_resource(
        schedule_id: Annotated[int, "Schedule ID"],
        limit: Annotated[int, "Maximum number of results"] = 20,
        offset: Annotated[int, "Pagination offset"] = 0,
        hide_successful: Annotated[
            bool, "Hide successful runs, show only failures"
        ] = False,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[ResourceContent]:
        """Get execution history for a schedule."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            result = get_schedule_runs_data(
                schedule_id, uid, session, limit, offset, hide_successful
            )
            return [ResourceContent({"runs": result})]
