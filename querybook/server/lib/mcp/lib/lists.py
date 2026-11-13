"""List utility functions for MCP tools."""

from lib.mcp.utils import build_querybook_url
from logic.board import get_board_editors_by_board_id
from logic.board_permission import BoardDoesNotExist, user_can_read
from models.board import Board
from models.environment import Environment


def serialize_list_editor(editor) -> dict:
    """Serialize a List editor model with user resource URI.

    Args:
        editor: BoardEditor model object

    Returns:
        Dict with all editor fields and user_resource_uri
    """
    editor_dict = editor.to_dict()
    editor_dict["user_resource_uri"] = f"querybook://user/{editor.uid}"
    return editor_dict


def serialize_list(
    list_obj,
    environment_id: int,
    session,
    include_items: bool = False,
    with_editors: bool = False,
) -> dict:
    """Serialize a List model to dict with all fields, resource_uri, and URL.

    Args:
        list_obj: Board model object
        environment_id: Environment ID for URL construction
        session: Database session
        include_items: If True, include serialized list items
        with_editors: If True, include list of editors with permissions

    Returns:
        Dict with all list fields, resource_uri, url, and optionally items and editors
    """
    result = {
        "id": list_obj.id,
        "name": list_obj.name,
        "description": list_obj.description,
        "public": list_obj.public,
        "owner_uid": list_obj.owner_uid,
        "owner_resource_uri": f"querybook://user/{list_obj.owner_uid}",
        "environment_id": list_obj.environment_id,
        "list_type": list_obj.board_type,
        "created_at": (
            list_obj.created_at.isoformat() if list_obj.created_at else None
        ),
        "updated_at": (
            list_obj.updated_at.isoformat() if list_obj.updated_at else None
        ),
        "resource_uri": f"querybook://list/{list_obj.id}",
    }

    if include_items:
        result["items"] = [serialize_list_item(item) for item in list_obj.items]

    if with_editors:
        editors = get_board_editors_by_board_id(list_obj.id, session=session)
        result["editors"] = [serialize_list_editor(editor) for editor in editors]

    environment = session.query(Environment).get(environment_id)
    if environment:
        url = build_querybook_url(environment.name, f"list/{list_obj.id}")
        if url:
            result["url"] = url

    return result


def serialize_list_item(item) -> dict:
    """Serialize a ListItem model to a dictionary."""
    result = {
        "id": item.id,
        "data_doc_id": item.data_doc_id,
        "table_id": item.table_id,
        "list_id": item.board_id,
        "query_execution_id": item.query_execution_id,
        "item_order": item.item_order,
        "description": item.description,
        "created_at": (item.created_at.isoformat() if item.created_at else None),
    }

    # Determine and add item_type (translate "board" to "list" for external API)
    if item.data_doc_id is not None:
        result["item_type"] = "data_doc"
        result["datadoc_resource_uri"] = f"querybook://datadoc/{item.data_doc_id}"
    elif item.table_id is not None:
        result["item_type"] = "table"
    elif item.board_id is not None:
        result["item_type"] = (
            "list"  # Translate from internal "board" to external "list"
        )
        result["list_resource_uri"] = f"querybook://list/{item.board_id}"
    elif item.query_execution_id is not None:
        result["item_type"] = "query"

    return result


def get_list_data(list_id: int, uid: int, session) -> dict:
    """Get list data with permission checking.

    Args:
        list_id: List ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        Serialized list dict with items and editors

    Raises:
        ValueError: If list not found or user lacks permission
    """
    try:
        if not user_can_read(list_id, uid, session=session):
            raise ValueError("You do not have access to this list.")
    except BoardDoesNotExist:
        raise ValueError(f"List {list_id} not found.")

    list_obj = Board.get(id=list_id, session=session)
    return serialize_list(
        list_obj,
        list_obj.environment_id,
        session,
        include_items=True,
        with_editors=True,
    )
