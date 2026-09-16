"""User utility functions for MCP tools."""

from logic.user import get_user_by_id


def serialize_user(user) -> dict:
    """Serialize a User model to dict with all fields and resource_uri.

    Args:
        user: User model object

    Returns:
        Dict with all user fields and resource_uri
    """
    user_dict = {
        "id": user.id,
        "username": user.username,
        "fullname": user.fullname,
        "email": user.email,
        "deleted": user.deleted,
        "is_group": user.is_group,
        "properties": user.properties.get("public_info", {}),
        "resource_uri": f"querybook://user/{user.id}",
    }
    return user_dict


def get_user_data(user_id: int | str, uid: int, session) -> dict:
    """Get user data.

    Args:
        user_id: User ID or 'me' for current user
        uid: Current user ID (for resolving 'me')
        session: Database session

    Returns:
        Serialized user dict

    Raises:
        ValueError: If user_id is invalid or user not found
    """
    # Handle 'me' as current user
    if user_id == "me":
        target_uid = uid
    elif isinstance(user_id, int):
        target_uid = user_id
    else:
        try:
            target_uid = int(user_id)
        except ValueError:
            raise ValueError(f"Invalid user_id: {user_id}. Must be an integer or 'me'.")

    user = get_user_by_id(target_uid, session=session)
    if not user:
        raise ValueError(f"User {target_uid} not found.")

    return serialize_user(user)
