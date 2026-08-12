"""Environment utility functions for MCP tools."""

from lib.mcp.lib.query_engines import serialize_query_engine
from logic import admin as admin_logic
from logic.environment import get_environment_by_id, get_all_visible_environments_by_uid


def serialize_environment(
    env, uid: int | None = None, session=None, with_query_engines: bool = False
) -> dict:
    """Serialize an Environment model to dict with all fields and resource_uri.

    Args:
        env: Environment model object
        uid: User ID for filtering accessible query engines (required if with_query_engines=True)
        session: Database session (required if with_query_engines=True)
        with_query_engines: If True, include list of accessible query engines with resource URIs

    Returns:
        Dict with all environment fields and resource_uri
    """
    # Handle both dict and model object
    if hasattr(env, "to_dict"):
        env_dict = env.to_dict()
    else:
        env_dict = {"id": env.id, "name": env.name}

    env_dict["resource_uri"] = f"querybook://environment/{env_dict['id']}"

    if with_query_engines and uid is not None and session is not None:
        engines = admin_logic.get_query_engines_by_environment(
            env_dict["id"], ordered=True, session=session
        )
        env_dict["query_engines"] = [serialize_query_engine(qe) for qe in engines]

    return env_dict


def get_environment_data(environment_id: int, uid: int, session) -> dict:
    """Get environment data with permission checking.

    Args:
        environment_id: Environment ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        Serialized environment dict

    Raises:
        ValueError: If environment not found or user lacks permission
    """
    environment = get_environment_by_id(environment_id, session=session)
    if not environment:
        raise ValueError(f"Environment {environment_id} not found.")

    # Check if user has access to this environment
    visible_envs = get_all_visible_environments_by_uid(uid, session=session)
    if environment.id not in [e.id for e in visible_envs]:
        raise ValueError("You do not have access to this environment.")

    return serialize_environment(
        environment, uid=uid, session=session, with_query_engines=True
    )
