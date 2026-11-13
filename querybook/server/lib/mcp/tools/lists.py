from typing import Annotated, Literal

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.lists import (
    serialize_list,
    serialize_list_editor,
    serialize_list_item,
    get_list_data,
)
from lib.mcp.utils import (
    READ_ONLY_ANNOTATIONS,
    WRITE_ANNOTATIONS,
    CREATE_ANNOTATIONS,
    DELETE_ANNOTATIONS,
    build_querybook_url,
)
from logic.board import (
    get_user_boards,
    get_all_public_boards,
    create_board as create_board_logic,
    update_board as update_board_logic,
    add_item_to_board,
    update_board_item as update_board_item_logic,
    remove_item_from_board,
    create_board_editor,
    get_board_editor_by_id,
    update_board_editor as update_board_editor_logic,
    delete_board_editor as delete_board_editor_logic,
)
from logic.board_permission import BoardDoesNotExist, user_can_edit
from models.board import Board, BoardItem
from models.environment import Environment


def register(mcp: FastMCP) -> None:
    """Register list tools on the given MCP server."""

    @mcp.tool(
        title="Get List",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def get_list(
        list_id: Annotated[int, "List ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Get a single list with its items and editors by ID."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            return get_list_data(list_id, uid, session)

    @mcp.tool(
        title="List Lists",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def list_lists(
        environment_id: Annotated[int, "Environment ID from list_environments"],
        scope: Annotated[
            Literal["mine", "public"],
            "Which lists to return: 'mine' (owned by you), 'public' (all public lists).",
        ] = "mine",
        token: AccessToken = CurrentAccessToken(),
    ) -> list[dict]:
        """Enumerates lists in the given environment, filtered by scope."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            if scope == "mine":
                lists = get_user_boards(uid, environment_id, session=session)
            elif scope == "public":
                lists = get_all_public_boards(environment_id, session=session)
            else:
                raise ValueError(f"Invalid scope: {scope}")

            return [
                serialize_list(list_obj, environment_id, session) for list_obj in lists
            ]

    @mcp.tool(
        title="Search Lists",
        annotations=READ_ONLY_ANNOTATIONS,
    )
    def search_lists(
        environment_id: Annotated[int, "Environment ID from list_environments"],
        keywords: Annotated[str, "Search keywords"],
        filters: Annotated[
            list[list] | None, "Filters as list of [field, value] pairs"
        ] = None,
        limit: Annotated[int, "Maximum number of results"] = 100,
        offset: Annotated[int, "Pagination offset"] = 0,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Search lists using keywords and filters."""
        if limit > 100:
            raise ValueError("Limit cannot exceed 100")

        uid = token.claims["creator_uid"]

        from lib.elasticsearch.search_board import construct_board_query
        from lib.elasticsearch.search_utils import get_matching_objects, ES_CONFIG

        with DBSession() as session:
            # Add environment filter
            filters_with_env = (filters or []) + [["environment_id", environment_id]]

            query = construct_board_query(
                uid=uid,
                keywords=keywords.strip(),
                filters=filters_with_env,
                fields=[],
                limit=limit,
                offset=offset,
                sort_key=None,
                sort_order=None,
            )

            results, count = get_matching_objects(
                query, ES_CONFIG["boards"]["index_name"], True
            )

            # Add resource URIs and URLs to search results, translate field names
            environment = session.query(Environment).get(environment_id)
            for result in results:
                # Translate board_type to list_type in result
                source = result.get("_source", {})
                if "board_type" in source:
                    source["list_type"] = source.pop("board_type")
                if "board_type" in result:
                    result["list_type"] = result.pop("board_type")

                list_id = source.get("id") or result.get("id")
                if list_id:
                    result["resource_uri"] = f"querybook://list/{list_id}"
                    if environment:
                        url = build_querybook_url(environment.name, f"list/{list_id}")
                        if url:
                            result["url"] = url

            return {"count": count, "results": results}

    @mcp.tool(
        title="Create List",
        annotations=CREATE_ANNOTATIONS,
    )
    def create_list(
        environment_id: Annotated[int, "Environment ID from list_environments"],
        name: Annotated[str, "List name"],
        description: Annotated[str | None, "List description"] = None,
        public: Annotated[bool, "Whether the list is public"] = False,
        list_type: Annotated[str, "List type"] = "",
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Create a new list."""
        owner_uid = token.claims["creator_uid"]
        with DBSession() as session:
            list_obj = create_board_logic(
                name=name,
                environment_id=environment_id,
                owner_uid=owner_uid,
                description=description,
                public=public,
                board_type=list_type,
                commit=True,
                session=session,
            )
            return serialize_list(list_obj, environment_id, session)

    @mcp.tool(
        title="Update List",
        annotations=WRITE_ANNOTATIONS,
    )
    def update_list(
        list_id: Annotated[int, "List ID from list_lists or search_lists"],
        name: Annotated[str | None, "New name for the list"] = None,
        description: Annotated[str | None, "New description for the list"] = None,
        public: Annotated[bool | None, "Whether the list is public"] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Update list properties. Only non-null fields are updated."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            try:
                if not user_can_edit(list_id, uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {list_id} not found.")

            fields = {}
            if name is not None:
                fields["name"] = name
            if description is not None:
                fields["description"] = description
            if public is not None:
                fields["public"] = public

            update_board_logic(id=list_id, commit=True, session=session, **fields)

            list_obj = Board.get(id=list_id, session=session)
            return serialize_list(list_obj, list_obj.environment_id, session)

    @mcp.tool(
        title="Delete List",
        annotations=DELETE_ANNOTATIONS,
    )
    def delete_list(
        list_id: Annotated[int, "List ID from list_lists or search_lists"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Delete a list. Cannot delete favorite lists."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            try:
                if not user_can_edit(list_id, uid, session=session):
                    raise ValueError("You do not have permission to delete this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {list_id} not found.")

            list_obj = Board.get(id=list_id, session=session)
            if list_obj.board_type == "favorite":
                raise ValueError("Cannot delete favorite lists.")

            Board.delete(list_obj.id, session=session)
            return {"deleted": list_id}

    @mcp.tool(
        title="Add List Item",
        annotations=WRITE_ANNOTATIONS,
    )
    def add_list_item(
        list_id: Annotated[int, "List ID from list_lists or search_lists"],
        item_id: Annotated[
            int, "ID of the item to add (datadoc_id, table_id, etc. based on item_type)"
        ],
        item_type: Annotated[
            Literal["data_doc", "table", "list", "query"],
            "Type of item: 'data_doc', 'table', 'list', or 'query'",
        ],
        description: Annotated[
            str | None, "Optional description for the list item"
        ] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Add an item to a list."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            try:
                if not user_can_edit(list_id, uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {list_id} not found.")

            # Translate "list" to "board" for internal database API
            internal_item_type = "board" if item_type == "list" else item_type

            list_item = add_item_to_board(
                list_id, item_id, internal_item_type, session=session
            )

            # Optionally set description if provided
            if description is not None:
                list_item = update_board_item_logic(
                    list_item.id, description=description, session=session
                )

            return serialize_list_item(list_item)

    @mcp.tool(
        title="Update List Item",
        annotations=WRITE_ANNOTATIONS,
    )
    def update_list_item(
        list_item_id: Annotated[
            int, "List item ID from get_list, not the datadoc_id/table_id/etc"
        ],
        description: Annotated[str | None, "Item description"] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Update a list item's description."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            # Load the list item first to get its parent list
            list_item = BoardItem.get(id=list_item_id, session=session)
            if not list_item:
                raise ValueError(f"List item {list_item_id} not found.")

            # Check permission against the actual parent list
            try:
                if not user_can_edit(list_item.parent_board_id, uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {list_item.parent_board_id} not found.")

            fields = {}
            if description is not None:
                fields["description"] = description

            if fields:
                updated_item = update_board_item_logic(
                    list_item_id, session=session, **fields
                )
                if not updated_item:
                    raise ValueError(f"Failed to update list item {list_item_id}.")
                list_item = updated_item

            return serialize_list_item(list_item)

    @mcp.tool(
        title="Remove List Item",
        annotations=DELETE_ANNOTATIONS,
    )
    def remove_list_item(
        list_id: Annotated[int, "List ID from list_lists or search_lists"],
        item_id: Annotated[
            int,
            "ID of the item to remove: datadoc_id, table_id, etc. based on item_type",
        ],
        item_type: Annotated[
            Literal["data_doc", "table", "list", "query"],
            "Type of item: 'data_doc', 'table', 'list', or 'query'",
        ],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Remove an item from a list."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            try:
                if not user_can_edit(list_id, uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {list_id} not found.")

            # Translate "list" to "board" for internal database API
            internal_item_type = "board" if item_type == "list" else item_type

            remove_item_from_board(
                list_id, item_id, internal_item_type, session=session
            )
            return {"removed": item_id, "list_id": list_id, "item_type": item_type}

    @mcp.tool(
        title="Add List Editor",
        annotations=WRITE_ANNOTATIONS,
    )
    def add_list_editor(
        list_id: Annotated[int, "List ID"],
        user_id: Annotated[int, "User ID to add as editor, from search_users"],
        read: Annotated[bool, "Grant read permission"] = False,
        write: Annotated[bool, "Grant write permission"] = False,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Add an editor to a list with specified permissions."""
        caller_uid = token.claims["creator_uid"]

        with DBSession() as session:
            try:
                if not user_can_edit(list_id, caller_uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {list_id} not found.")

            editor = create_board_editor(
                board_id=list_id,
                uid=user_id,
                read=read,
                write=write,
                commit=True,
                session=session,
            )

            return serialize_list_editor(editor)

    @mcp.tool(
        title="Update List Editor",
        annotations=WRITE_ANNOTATIONS,
    )
    def update_list_editor(
        editor_id: Annotated[int, "Editor ID not the user_id"],
        read: Annotated[bool | None, "New read permission (null = no change)"] = None,
        write: Annotated[bool | None, "New write permission (null = no change)"] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Update permissions for an editor on a list."""
        uid = token.claims["creator_uid"]

        with DBSession() as session:
            editor = get_board_editor_by_id(editor_id, session=session)
            if not editor:
                raise ValueError(f"Editor {editor_id} not found.")

            try:
                if not user_can_edit(editor.board_id, uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {editor.board_id} not found.")

            updated_editor = update_board_editor_logic(
                id=editor_id,
                read=read,
                write=write,
                session=session,
            )

            return serialize_list_editor(updated_editor) if updated_editor else {}

    @mcp.tool(
        title="Remove List Editor",
        annotations=DELETE_ANNOTATIONS,
    )
    def remove_list_editor(
        editor_id: Annotated[int, "Editor ID not the user_id"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Remove an editor from a list."""
        uid = token.claims["creator_uid"]

        with DBSession() as session:
            editor = get_board_editor_by_id(editor_id, session=session)
            if not editor:
                raise ValueError(f"Editor {editor_id} not found.")

            try:
                if not user_can_edit(editor.board_id, uid, session=session):
                    raise ValueError("You do not have permission to edit this list.")
            except BoardDoesNotExist:
                raise ValueError(f"List {editor.board_id} not found.")

            delete_board_editor_logic(
                id=editor_id, board_id=editor.board_id, session=session
            )

            return {"removed": editor_id, "list_id": editor.board_id}
