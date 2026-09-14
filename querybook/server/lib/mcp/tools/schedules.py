from typing import Annotated, Literal
from pydantic import BaseModel, Field

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.schedules import (
    DEFAULT_RETRY,
    exports_to_kwargs,
    get_datadoc_id_from_schedule,
    notifications_to_kwargs,
    retry_to_kwargs,
    serialize_schedule,
)
from lib.mcp.utils import (
    READ_ONLY_ANNOTATIONS,
    WRITE_ANNOTATIONS,
    CREATE_ANNOTATIONS,
    DELETE_ANNOTATIONS,
)
from logic.datadoc_permission import user_can_write, DocDoesNotExist
from logic.schedule import (
    create_task_schedule,
    get_task_schedule_by_id,
    get_scheduled_data_docs_by_user,
    update_task_schedule,
    delete_task_schedule,
    get_data_doc_schedule_name,
)


class NotificationConfig(BaseModel):
    """Configuration for schedule notifications."""

    notifier: Annotated[
        str,
        Field(
            description="Notifier to use: 'email', 'slack', 'teams', etc. Available notifiers depend on server configuration."
        ),
    ]
    on: Annotated[
        Literal["all", "failure", "success"],
        Field(
            description="When to notify: 'all' (every run), 'failure' (only on failure), 'success' (only on success)"
        ),
    ] = "all"
    recipients: Annotated[
        list[str] | None,
        Field(
            description="Recipients to notify (e.g., email addresses, Slack channel IDs, etc.)"
        ),
    ] = None
    user_ids: Annotated[
        list[int] | None,
        Field(description="User IDs to notify via their preferred notifier"),
    ] = None


class RetryConfig(BaseModel):
    """Configuration for automatic retry on failure."""

    enabled: Annotated[bool, Field(description="Enable automatic retry on failure")] = (
        False
    )
    max_retries: Annotated[
        int, Field(description="Maximum number of retry attempts")
    ] = 1
    delay_sec: Annotated[
        int, Field(description="Delay in seconds between retry attempts")
    ] = 60


class ExportConfig(BaseModel):
    """Configuration for exporting query results after execution."""

    cell_id: Annotated[int, Field(description="Cell ID to export results from")]
    exporter_name: Annotated[
        str, Field(description="Exporter to use (e.g., 's3', 'gcs', 'email')")
    ]
    exporter_params: Annotated[
        dict, Field(description="Exporter-specific parameters")
    ] = {}


def register(mcp: FastMCP) -> None:
    """Register schedule tools on the given MCP server."""

    @mcp.tool(
        title="Create DataDoc Schedule",
        annotations=CREATE_ANNOTATIONS,
    )
    def create_datadoc_schedule(
        datadoc_id: Annotated[int, "DataDoc ID to schedule"],
        cron: Annotated[
            str,
            "Cron expression in UTC timezone, e.g., '0 9 * * *' for daily at 9am UTC",
        ],
        enabled: Annotated[bool, "Whether the schedule is enabled"] = True,
        notifications: Annotated[
            list[NotificationConfig] | None,
            "Notification settings for schedule completion",
        ] = None,
        retry: Annotated[
            RetryConfig | None, "Automatic retry configuration on failure"
        ] = None,
        exports: Annotated[
            list[ExportConfig] | None, "Export configurations for query results"
        ] = None,
        disable_if_running: Annotated[
            bool, "Skip scheduled run if DataDoc is already running"
        ] = False,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Schedule a DataDoc to run on a cron schedule with optional notifications, retries, and exports."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            try:
                if not user_can_write(datadoc_id, uid, session=session):
                    raise ValueError(
                        "You do not have permission to schedule this DataDoc."
                    )
            except DocDoesNotExist:
                raise ValueError(f"DataDoc {datadoc_id} not found.")

            schedule_name = get_data_doc_schedule_name(datadoc_id)

            # Build kwargs from structured parameters
            kwargs = {
                "user_id": uid,
                "doc_id": datadoc_id,
                "disable_if_running_doc": disable_if_running,
            }

            # Convert structured configs to internal format
            kwargs["notifications"] = (
                notifications_to_kwargs(notifications) if notifications else []
            )
            kwargs["retry"] = retry_to_kwargs(retry) if retry else dict(DEFAULT_RETRY)
            kwargs["exports"] = exports_to_kwargs(exports) if exports else []

            schedule = create_task_schedule(
                name=schedule_name,
                task="tasks.run_datadoc.run_datadoc",
                cron=cron,
                kwargs=kwargs,
                enabled=enabled,
                commit=True,
                session=session,
            )

            return serialize_schedule(schedule)

    @mcp.tool(
        title="List DataDoc Schedules",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def list_datadoc_schedules(
        environment_id: Annotated[int, "Environment ID from list_environments"],
        enabled: Annotated[bool | None, "Filter by enabled status"] = None,
        offset: Annotated[int, "Pagination offset"] = 0,
        limit: Annotated[int, "Maximum number of results"] = 100,
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """List all DataDoc schedules for the current user in an environment."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            filters = {}
            if enabled is not None:
                filters["status"] = enabled

            docs_with_schedules, count = get_scheduled_data_docs_by_user(
                uid, environment_id, offset, limit, filters=filters, session=session
            )

            result = []
            for item in docs_with_schedules:
                schedule = item.get("schedule")
                if schedule:
                    result.append(serialize_schedule(schedule))

            return result

    @mcp.tool(
        title="Update DataDoc Schedule",
        annotations=WRITE_ANNOTATIONS,
    )
    def update_datadoc_schedule(
        schedule_id: Annotated[int, "Schedule ID"],
        cron: Annotated[
            str | None,
            "Cron expression in UTC timezone, e.g., '0 9 * * *' for daily at 9am UTC",
        ] = None,
        enabled: Annotated[bool | None, "Enable or disable the schedule"] = None,
        notifications: Annotated[
            list[NotificationConfig] | None,
            "New notification settings (replaces existing)",
        ] = None,
        retry: Annotated[
            RetryConfig | None, "New retry configuration (replaces existing)"
        ] = None,
        exports: Annotated[
            list[ExportConfig] | None, "New export configurations (replaces existing)"
        ] = None,
        disable_if_running: Annotated[
            bool | None, "Skip scheduled run if DataDoc is already running"
        ] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Update a DataDoc schedule's settings. Only non-null fields are updated."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            schedule = get_task_schedule_by_id(schedule_id, session=session)
            if not schedule:
                raise ValueError(f"Schedule {schedule_id} not found.")

            datadoc_id = get_datadoc_id_from_schedule(schedule)
            if datadoc_id is None:
                raise ValueError("Schedule is not a DataDoc schedule.")

            try:
                if not user_can_write(datadoc_id, uid, session=session):
                    raise ValueError(
                        "You do not have permission to update this schedule."
                    )
            except DocDoesNotExist:
                raise ValueError(f"DataDoc {datadoc_id} not found.")

            fields = {}
            if cron is not None:
                fields["cron"] = cron
            if enabled is not None:
                fields["enabled"] = enabled

            # Update kwargs if any advanced settings changed
            if any(
                x is not None
                for x in [notifications, retry, exports, disable_if_running]
            ):
                kwargs = dict(schedule.kwargs)  # Copy existing kwargs

                if notifications is not None:
                    kwargs["notifications"] = notifications_to_kwargs(notifications)
                if retry is not None:
                    kwargs["retry"] = retry_to_kwargs(retry)
                if exports is not None:
                    kwargs["exports"] = exports_to_kwargs(exports)

                if disable_if_running is not None:
                    kwargs["disable_if_running_doc"] = disable_if_running

                fields["kwargs"] = kwargs

            update_task_schedule(schedule_id, commit=True, session=session, **fields)

            # Return updated schedule
            schedule = get_task_schedule_by_id(schedule_id, session=session)
            return serialize_schedule(schedule)

    @mcp.tool(
        title="Delete DataDoc Schedule",
        annotations=DELETE_ANNOTATIONS,
    )
    def delete_datadoc_schedule(
        schedule_id: Annotated[int, "Schedule ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Delete a DataDoc schedule."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            schedule = get_task_schedule_by_id(schedule_id, session=session)
            if not schedule:
                raise ValueError(f"Schedule {schedule_id} not found.")

            datadoc_id = get_datadoc_id_from_schedule(schedule)
            if datadoc_id is None:
                raise ValueError("Schedule is not a DataDoc schedule.")

            try:
                if not user_can_write(datadoc_id, uid, session=session):
                    raise ValueError(
                        "You do not have permission to delete this schedule."
                    )
            except DocDoesNotExist:
                raise ValueError(f"DataDoc {datadoc_id} not found.")

            delete_task_schedule(schedule_id, commit=True, session=session)
            return {"deleted": schedule_id}
