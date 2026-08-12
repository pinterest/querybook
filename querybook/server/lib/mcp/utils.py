"""Shared utilities for MCP tools and resources."""

from logic import admin as admin_logic
from logic.environment import get_all_accessible_environment_ids_by_uid
from models.admin import QueryEngineEnvironment
from env import QuerybookSettings


def build_querybook_url(environment_name: str, path: str) -> str | None:
    """Build a Querybook web UI URL.

    Args:
        environment_name: Environment name for the URL path
        path: Resource path, e.g. "datadoc/123" or "list/456"

    Returns:
        Full URL string, or None if PUBLIC_URL is not configured
    """
    if not QuerybookSettings.PUBLIC_URL:
        return None
    return f"{QuerybookSettings.PUBLIC_URL}/{environment_name}/{path}/"


def verify_query_engine_access(engine_id: int, uid: int, session) -> None:
    """Verify user has access to query engine through environment permissions.

    This mimics the upstream permission.py verify_query_engine_permission logic.

    Args:
        engine_id: Query engine ID to check
        uid: User ID making the request
        session: Database session

    Raises:
        ValueError: If engine doesn't exist or user lacks access
    """
    # Get the query engine
    engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
    if not engine:
        raise ValueError(f"Query engine {engine_id} not found.")

    # Get environments this engine belongs to
    engine_env_ids = [
        eid
        for eid, in session.query(QueryEngineEnvironment.environment_id).filter(
            QueryEngineEnvironment.query_engine_id == engine_id
        )
    ]

    # Get environments the user has access to
    accessible_env_ids = get_all_accessible_environment_ids_by_uid(uid, session=session)

    # Check if user has access to at least one environment that has this engine
    if not any(eid in accessible_env_ids for eid in engine_env_ids):
        raise ValueError(f"You do not have access to query engine {engine_id}.")


# Annotation constants for MCP tools and resources
READ_ONLY_ANNOTATIONS = {
    "destructiveHint": False,
    "idempotentHint": True,
    "openWorldHint": False,
    "readOnlyHint": True,
}

WRITE_ANNOTATIONS = {
    "destructiveHint": False,
    "idempotentHint": True,
    "openWorldHint": False,
    "readOnlyHint": False,
}

CREATE_ANNOTATIONS = {
    "destructiveHint": False,
    "idempotentHint": False,
    "openWorldHint": False,
    "readOnlyHint": False,
}

DELETE_ANNOTATIONS = {
    "destructiveHint": True,
    "idempotentHint": True,
    "openWorldHint": False,
    "readOnlyHint": False,
}

RESOURCE_ANNOTATIONS = {
    "readOnlyHint": True,
    "idempotentHint": True,
}
