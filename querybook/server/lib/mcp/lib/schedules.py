"""Schedule-related utilities for MCP."""

from const.schedule import TaskRunStatus
from logic.datadoc_permission import user_can_read, DocDoesNotExist
from logic.schedule import get_task_schedule_by_id, get_task_run_record_run_by_name


def _add_run_status_name(run_dict: dict) -> dict:
    """Add human-readable status name to run dict (MCP enhancement over API).

    Args:
        run_dict: Run dictionary with integer status field

    Returns:
        Run dict with status_name field added
    """
    if "status" in run_dict:
        try:
            status_enum = TaskRunStatus(run_dict["status"])
            run_dict["status_name"] = status_enum.name
        except (ValueError, KeyError):
            pass
    return run_dict


def get_datadoc_id_from_schedule(schedule) -> int | None:
    """Extract datadoc ID from schedule kwargs (safer than parsing name).

    Args:
        schedule: TaskSchedule object

    Returns:
        DataDoc ID if found in kwargs, None otherwise
    """
    if schedule.kwargs and isinstance(schedule.kwargs, dict):
        return schedule.kwargs.get("doc_id")
    return None


def humanize_notifications(notifications: list[dict]) -> list[dict]:
    """Convert notification 'on' values from integers to human-readable strings.

    Args:
        notifications: List of notification dicts with 'on' as integer (0=all, 1=failure, 2=success)

    Returns:
        List of notification dicts with 'on' as string
    """
    on_map = {0: "all", 1: "failure", 2: "success"}
    humanized = []
    for notif in notifications:
        notif_copy = dict(notif)
        if "on" in notif_copy:
            notif_copy["on"] = on_map.get(notif_copy["on"], notif_copy["on"])
        # Also flatten config for easier reading
        if "config" in notif_copy:
            config = notif_copy["config"]
            notif_copy["recipients"] = config.get("to", [])
            notif_copy["user_ids"] = config.get("to_user", [])
            del notif_copy["config"]
        # Rename 'with' to 'notifier' for clarity
        if "with" in notif_copy:
            notif_copy["notifier"] = notif_copy.pop("with")
        humanized.append(notif_copy)
    return humanized


def notifications_to_kwargs(notifications) -> list[dict]:
    """Convert NotificationConfig list to internal kwargs format."""
    return [
        {
            "with": notif.notifier,
            "on": {"all": 0, "failure": 1, "success": 2}[notif.on],
            "config": {
                "to": notif.recipients or [],
                "to_user": notif.user_ids or [],
            },
        }
        for notif in notifications
    ]


def retry_to_kwargs(retry) -> dict:
    """Convert RetryConfig to internal kwargs format."""
    return {
        "enabled": retry.enabled,
        "max_retries": retry.max_retries,
        "delay_sec": retry.delay_sec,
    }


def exports_to_kwargs(exports) -> list[dict]:
    """Convert ExportConfig list to internal kwargs format."""
    return [
        {
            "exporter_cell_id": export.cell_id,
            "exporter_name": export.exporter_name,
            "exporter_params": export.exporter_params,
        }
        for export in exports
    ]


DEFAULT_RETRY = {"enabled": False, "max_retries": 1, "delay_sec": 60}


def serialize_schedule(schedule) -> dict:
    """Convert TaskSchedule object to dict with all fields and resource_uri.

    Args:
        schedule: TaskSchedule object

    Returns:
        Dict with all schedule fields, datadoc_id, resource_uri, and humanized kwargs
    """
    datadoc_id = get_datadoc_id_from_schedule(schedule)

    result = {
        "id": schedule.id,
        "name": schedule.name,
        "task": schedule.task,
        "cron": schedule.cron,
        "args": schedule.args,
        "kwargs": schedule.kwargs,  # Keep raw kwargs for backward compatibility
        "options": schedule.options,
        "last_run_at": (
            schedule.last_run_at.isoformat() if schedule.last_run_at else None
        ),
        "total_run_count": schedule.total_run_count,
        "enabled": schedule.enabled,
        "datadoc_id": datadoc_id,
        "resource_uri": f"querybook://schedule/{schedule.id}",
        "runs_resource_uri": f"querybook://schedule/{schedule.id}/runs?limit=&offset=&hide_successful=",
    }

    # Add datadoc resource_uri if datadoc_id exists
    if datadoc_id is not None:
        result["datadoc_resource_uri"] = f"querybook://datadoc/{datadoc_id}"

    # Add humanized versions of kwargs at top level (matching Pydantic model format)
    # Raw internal format is still available in kwargs for compatibility
    if schedule.kwargs and isinstance(schedule.kwargs, dict):
        kwargs = schedule.kwargs

        if "notifications" in kwargs and kwargs["notifications"]:
            result["notifications"] = humanize_notifications(kwargs["notifications"])
        else:
            result["notifications"] = []

        if "retry" in kwargs:
            result["retry"] = kwargs["retry"]
        else:
            result["retry"] = dict(DEFAULT_RETRY)

        if "exports" in kwargs and kwargs["exports"]:
            result["exports"] = kwargs["exports"]
        else:
            result["exports"] = []

        if "disable_if_running_doc" in kwargs:
            result["disable_if_running"] = kwargs["disable_if_running_doc"]
        else:
            result["disable_if_running"] = False

    return result


def _get_schedule_with_read_permission(schedule_id: int, uid: int, session):
    """Fetch a schedule and verify the user has read access to its DataDoc.

    Args:
        schedule_id: Schedule ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        TaskSchedule object

    Raises:
        ValueError: If schedule not found, not a DataDoc schedule, or user lacks permission
    """
    schedule = get_task_schedule_by_id(schedule_id, session=session)
    if not schedule:
        raise ValueError(f"Schedule {schedule_id} not found.")

    datadoc_id = get_datadoc_id_from_schedule(schedule)
    if datadoc_id is None:
        raise ValueError("Schedule is not a DataDoc schedule.")

    try:
        if not user_can_read(datadoc_id, uid, session=session):
            raise ValueError("You do not have access to this schedule.")
    except DocDoesNotExist:
        raise ValueError(f"DataDoc {datadoc_id} not found.")

    return schedule


def get_schedule_runs_data(
    schedule_id: int,
    uid: int,
    session,
    limit: int = 20,
    offset: int = 0,
    hide_successful: bool = False,
) -> list[dict]:
    """Get execution history for a schedule with permission checking.

    Args:
        schedule_id: Schedule ID
        uid: User ID for permission checking
        session: Database session
        limit: Maximum number of results
        offset: Pagination offset
        hide_successful: Hide successful runs, show only failures

    Returns:
        List of serialized run dicts

    Raises:
        ValueError: If schedule not found, not a DataDoc schedule, or user lacks permission
    """
    schedule = _get_schedule_with_read_permission(schedule_id, uid, session)

    runs, count = get_task_run_record_run_by_name(
        schedule.name,
        limit=limit,
        offset=offset,
        hide_successful_jobs=hide_successful,
        session=session,
    )

    return [
        _add_run_status_name(
            {
                "id": run.id,
                "schedule_name": run.name,
                "status": run.status.value,  # Convert enum to integer
                "error_message": run.error_message,
                "created_at": (run.created_at.isoformat() if run.created_at else None),
                "updated_at": (run.updated_at.isoformat() if run.updated_at else None),
            }
        )
        for run in runs
    ]


def get_schedule_data(schedule_id: int, uid: int, session) -> dict:
    """Get schedule data with permission checking and recent runs.

    Args:
        schedule_id: Schedule ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        Serialized schedule dict with recent runs

    Raises:
        ValueError: If schedule not found, not a DataDoc schedule, or user lacks permission
    """
    schedule = _get_schedule_with_read_permission(schedule_id, uid, session)

    # Get recent runs
    runs, count = get_task_run_record_run_by_name(
        schedule.name, limit=5, session=session
    )

    # Serialize schedule and add recent runs
    result = serialize_schedule(schedule)
    result["recent_runs"] = [
        _add_run_status_name(
            {
                "id": run.id,
                "status": run.status.value,  # Convert enum to integer
                "error_message": run.error_message,
                "created_at": (run.created_at.isoformat() if run.created_at else None),
                "updated_at": (run.updated_at.isoformat() if run.updated_at else None),
            }
        )
        for run in runs
    ]

    return result
