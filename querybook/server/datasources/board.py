from flask_login import current_user

from app.datasource import register, api_assert
from app.db import DBSession, with_session
from app.auth.permission import (
    verify_environment_permission,
    get_data_table_environment_ids,
    get_data_doc_environment_ids,
    get_board_environment_ids,
)
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE
from logic import board as logic
from logic import user as user_logic
from logic.board_permission import assert_can_read, assert_can_edit, assert_is_owner
from logic.query_execution import get_environments_by_execution_id

from models.board import Board, BoardItem

from env import QuerybookSettings
from lib.notify.utils import notify_user


@register(
    "/board/",
    methods=["GET"],
)
def get_my_boards(environment_id, filter_str=None):
    with DBSession() as session:
        return logic.get_user_boards(
            current_user.id,
            environment_id=environment_id,
            filter_str=filter_str,
            session=session,
        )


@register(
    "/board/<int:board_id>/",
    methods=["GET"],
)
def get_board_by_id(board_id, environment_id):
    with DBSession() as session:
        if board_id == 0:
            verify_environment_permission([environment_id])
            public_boards = logic.get_all_public_boards(
                environment_id=environment_id, session=session
            )
            return {
                "id": 0,
                "boards": [public_board.id for public_board in public_boards],
            }

        assert_can_read(board_id, session=session)
        board = Board.get(id=board_id, session=session)
        api_assert(
            board is not None, "Invalid board id", RESOURCE_NOT_FOUND_STATUS_CODE
        )
        verify_environment_permission([board.environment_id])
        return board.to_dict(
            extra_fields=["docs", "tables", "boards", "queries", "items"]
        )


@register(
    "/board/",
    methods=["POST"],
)
def create_board(
    name,
    environment_id,
    description=None,
    public=None,
    favorite=False,
):
    with DBSession() as session:
        verify_environment_permission([environment_id])
        return logic.create_board(
            name,
            environment_id,
            current_user.id,
            description,
            public,
            favorite,
            session=session,
        ).to_dict()


@register(
    "/board/<int:board_id>/",
    methods=["PUT"],
)
def update_board(board_id, **fields):
    with DBSession() as session:
        assert_can_edit(board_id, session=session)
        board = Board.get(id=board_id, session=session)

        board = logic.update_board(id=board_id, **fields, session=session)
        return board.to_dict(
            extra_fields=["docs", "tables", "boards", "queries", "items"]
        )


@register(
    "/board/<int:board_id>/",
    methods=["DELETE"],
)
def delete_board(board_id, **fields):
    with DBSession() as session:
        assert_can_edit(board_id, session=session)
        board = Board.get(id=board_id, session=session)
        api_assert(not board.board_type == "favorite", "Cannot delete favorite")

        Board.delete(board.id, session=session)


@register("/board_item/<item_type>/<int:item_id>/board_id/", methods=["GET"])
def get_board_ids_from_board_item(item_type: str, item_id: int, environment_id: int):
    """Given a potential item, find all possible board ids it can
       be related to

    Arguments:
        item_type {[str]} -- [data_doc or table]
        item_id {[int]} -- [Doc id or table id]
        environment_id {[int]} - [id of board environment]
    """
    return logic.get_board_ids_from_board_item(item_type, item_id, environment_id)


@register("/board_item/<item_type>/<int:item_id>/board/", methods=["GET"])
def get_boards_from_board_item(item_type: str, item_id: int, environment_id: int):
    """Given a potential item, find all boards containing the item
       that the current user has access to

    Arguments:
        item_type {[str]} -- [data_doc or table]
        item_id {[int]} -- [Doc id or table id]
        environment_id {[int]} - [id of board environment]
    """
    verify_environment_permission([environment_id])
    return logic.get_boards_from_board_item(
        item_type, item_id, environment_id, current_user.id
    )


@register(
    "/board/<int:board_id>/<item_type>/<int:item_id>/",
    methods=["POST"],
)
def add_board_item(board_id, item_type, item_id):
    api_assert(
        item_type in ["data_doc", "table", "board", "query"],
        "Invalid item type",
    )

    with DBSession() as session:
        assert_can_edit(board_id, session=session)
        api_assert(
            not (item_type == "board" and item_id == board_id),
            "List cannot be added to itself",
        )

        board = Board.get(id=board_id, session=session)
        # You can only add item in the same environment as the board
        item_env_ids = []
        if item_type == "data_doc":
            item_env_ids = get_data_doc_environment_ids(item_id, session=session)
        elif item_type == "table":
            item_env_ids = get_data_table_environment_ids(item_id, session=session)
        elif item_type == "board":
            item_env_ids = get_board_environment_ids(item_id, session=session)
        else:
            item_env_ids = [
                env.id
                for env in get_environments_by_execution_id(item_id, session=session)
            ]

        api_assert(
            board.environment_id in item_env_ids,
            "List item must be in the same environment as the list",
        )
        api_assert(
            logic.get_item_from_board(board_id, item_id, item_type, session=session)
            is None,
            "Item already exists",
        )

        return logic.add_item_to_board(board_id, item_id, item_type, session=session)


@register(
    "/board/<int:board_id>/move/<int:from_index>/<int:to_index>/",
    methods=["POST"],
)
def move_board_item(board_id, from_index, to_index):
    if from_index != to_index:
        with DBSession() as session:
            assert_can_edit(board_id, session=session)
            logic.move_item_order(board_id, from_index, to_index, session=session)


@register(
    "/board/<int:board_id>/<item_type>/<int:item_id>/",
    methods=["DELETE"],
)
def delete_board_item(board_id, item_type, item_id):
    api_assert(
        item_type in ["data_doc", "table", "board", "query"],
        "Invalid item type",
    )
    with DBSession() as session:
        assert_can_edit(board_id, session=session)

        board = Board.get(id=board_id, session=session)
        logic.remove_item_from_board(board.id, item_id, item_type, session=session)


@register("/board/item/<int:board_item_id>/", methods=["PUT"])
def update_board_item_fields(board_item_id, **fields):
    with DBSession() as session:
        board_item = BoardItem.get(id=board_item_id, session=session)
        api_assert(
            board_item,
            "List item does not exist",
        )
        assert_can_edit(board_item.parent_board_id, session=session)

        return logic.update_board_item(id=board_item_id, **fields, session=session)


@register("/board/<int:board_id>/editor/", methods=["GET"])
def get_board_editors(board_id):
    return logic.get_board_editors_by_board_id(board_id)


@register("/board/<int:board_id>/editor/<int:uid>/", methods=["POST"])
def add_board_editor(
    board_id,
    uid,
    read=None,
    write=None,
):
    with DBSession() as session:
        assert_can_edit(board_id, session=session)
        editor = logic.create_board_editor(
            board_id=board_id, uid=uid, read=read, write=write, commit=False
        )

        access_request = logic.get_board_access_request_by_board_id(
            board_id=board_id, uid=uid
        )
        if access_request:
            logic.remove_board_access_request(board_id=board_id, uid=uid, commit=False)

        session.commit()

        logic.update_es_boards_by_id(board_id)
        send_add_board_editor_notification(board_id, uid, read, write)
        return editor


@register("/board/<int:board_id>/access_request/", methods=["GET"])
def get_board_access_requests(board_id):
    assert_can_edit(board_id)
    return logic.get_board_access_requests_by_board_id(board_id)


@register("/board/<int:board_id>/access_request/", methods=["POST"])
def add_board_access_request(board_id):
    uid = current_user.id
    access_request_dict = None
    existing_access_request = logic.get_board_access_request_by_board_id(
        board_id=board_id, uid=uid
    )
    if not existing_access_request:
        access_request = logic.create_board_access_request(board_id=board_id, uid=uid)
        access_request_dict = access_request.to_dict()

    send_board_access_request_notification(board_id=board_id, uid=uid)
    return access_request_dict


@register("/board/<int:board_id>/access_request/", methods=["DELETE"])
def remove_board_access_request(
    board_id,
    uid,
):
    assert_can_edit(board_id)
    logic.remove_board_access_request(board_id=board_id, uid=uid)


@register("/board/<int:board_id>/owner/", methods=["POST"])
def update_board_owner(board_id, next_owner_id, originator=None):
    with DBSession() as session:
        # Add previous owner as an editor to the doc
        assert_is_owner(board_id, session=session)
        current_owner_editor = logic.create_board_editor(
            board_id=board_id,
            uid=current_user.id,
            read=True,
            write=True,
            commit=False,
            session=session,
        )

        # Remove next owner as a board editor
        next_owner_editor = logic.get_board_editor_by_id(next_owner_id, session=session)
        logic.delete_board_editor(
            id=next_owner_id, board_id=board_id, session=session, commit=False
        )
        next_owner_uid = next_owner_editor.uid
        # Update board owner to next owner
        logic.update_board(
            id=board_id, commit=False, session=session, owner_uid=next_owner_uid
        )
        session.commit()

        logic.update_es_boards_by_id(board_id)
        send_board_transfer_notification(board_id, next_owner_uid, session)
        return current_owner_editor


def send_board_transfer_notification(board_id, next_owner_id, session=None):
    inviting_user = user_logic.get_user_by_id(current_user.id, session=session)
    invited_user = user_logic.get_user_by_id(next_owner_id, session=session)
    board = Board.get(id=board_id, session=session)
    environment = board.environment

    board_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/board/{board_id}/"

    notify_user(
        user=invited_user,
        template_name="board_ownership_transfer",
        template_params=dict(
            inviting_username=inviting_user.get_name(),
            board_url=board_url,
            board_name=board.name,
        ),
        session=session,
    )


@with_session
def send_board_access_request_notification(board_id, uid, session=None):
    requestor = user_logic.get_user_by_id(uid, session=session)
    board = Board.get(id=board_id, session=session)
    environment = board.environment

    board_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/list/{board_id}/"

    owner = user_logic.get_user_by_id(board.owner_uid, session=session)
    doc_editors = [owner]
    writer_uids = [
        writer.uid for writer in logic.get_board_editors_by_board_id(board_id)
    ]
    doc_editors.extend(user_logic.get_users_by_ids(writer_uids))
    requestor_username = requestor.get_name()
    for user in doc_editors:
        notify_user(
            user=user,
            template_name="board_access_request",
            template_params=dict(
                username=requestor_username,
                board_name=board.name,
                board_url=board_url,
            ),
        )


@with_session
def send_add_board_editor_notification(board_id, uid, read, write, session=None):
    inviting_user = user_logic.get_user_by_id(current_user.id, session=session)
    invited_user = user_logic.get_user_by_id(uid, session=session)
    board = Board.get(id=board_id, session=session)
    environment = board.environment

    permission_type = "edit" if write else "view"

    board_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/list/{board_id}/"

    notify_user(
        user=invited_user,
        template_name="board_invitation",
        template_params=dict(
            inviting_username=inviting_user.get_name(),
            read_or_write=permission_type,
            board_url=board_url,
            board_name=board.name,
        ),
        session=session,
    )


@register("/board_editor/<int:id>/", methods=["PUT"])
def update_board_editor(
    id,
    write=None,
    read=None,
):
    with DBSession() as session:
        editor = logic.get_board_editor_by_id(id, session=session)

        api_assert(
            editor,
            "List editor does not exist",
        )
        assert_can_edit(editor.board_id, session=session)

        return logic.update_board_editor(id, read, write, session=session)


@register("/board_editor/<int:id>/", methods=["DELETE"])
def delete_board_editor(
    id,
):
    with DBSession() as session:
        editor = logic.get_board_editor_by_id(id, session=session)

        api_assert(
            editor,
            "List editor does not exist",
        )
        assert_can_edit(editor.board_id, session=session)

        return logic.delete_board_editor(
            id=id, board_id=editor.board_id, session=session
        )
