from flask_login import current_user

from app.datasource import register, api_assert
from app.db import DBSession
from app.auth.permission import (
    verify_environment_permission,
    get_data_table_environment_ids,
    get_data_doc_environment_ids,
    get_board_environment_ids,
)
from logic import board as logic
from logic.board_permission import assert_can_read, assert_can_edit
from models.board import Board


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
def get_board_by_id(board_id):
    with DBSession() as session:
        if board_id == 0:
            public_boards = logic.get_all_public_boards(session=session)
            print("pub", public_boards)
            return {
                "id": 0,
                "boards": [
                    public_board.to_dict()["id"] for public_board in public_boards
                ],
            }

        assert_can_read(board_id, session=session)
        board = Board.get(id=board_id, session=session)
        api_assert(board is not None, "Invalid board id", 404)
        verify_environment_permission([board.environment_id])
        return board.to_dict(extra_fields=["docs", "tables", "boards", "items"])


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
        return board.to_dict(extra_fields=["docs", "tables", "boards", "items"])


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


@register("/board_item/<item_type>/<int:item_id>/board/", methods=["GET"])
def get_board_ids_from_board_item(item_type: str, item_id: int, environment_id: int):
    """Given an potential item, find all possible board ids it can
       be related to

    Arguments:
        item_type {[str]} -- [data_doc or table]
        item_id {[int]} -- [Doc id or table id]
        environment_id {[int]} - [id of board environment]
    """
    return logic.get_board_ids_from_board_item(item_type, item_id, environment_id)


@register(
    "/board/<int:board_id>/<item_type>/<int:item_id>/",
    methods=["POST"],
)
def add_board_item(board_id, item_type, item_id):
    api_assert(
        item_type == "data_doc" or item_type == "table" or item_type == "board",
        "Invalid item type",
    )

    with DBSession() as session:
        assert_can_edit(board_id, session=session)

        board = Board.get(id=board_id, session=session)
        # You can only add item in the same environment as the board
        item_env_ids = []
        if item_type == "data_doc":
            item_env_ids = get_data_doc_environment_ids(item_id, session=session)
        elif item_type == "table":
            item_env_ids = get_data_table_environment_ids(item_id, session=session)
        else:
            item_env_ids = get_board_environment_ids(item_id, session=session)

        api_assert(
            board.environment_id in item_env_ids,
            "Board item must be in the same environment as the board",
        )
        api_assert(
            logic.get_item_from_board(board_id, item_id, item_type, session=session)
            is None,
            "Item already exists",
        )
        api_assert(
            not (item_type == "board" and item_id == board_id),
            "Board cannot be added to itself",
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
        item_type == "data_doc" or item_type == "table" or item_type == "board",
        "Invalid item type",
    )
    with DBSession() as session:
        assert_can_edit(board_id, session=session)

        board = Board.get(id=board_id, session=session)
        logic.remove_item_from_board(board.id, item_id, item_type, session=session)


@register("/board/favorite/", methods=["POST"])
def get_or_create_favorite_board(environment_id):
    verify_environment_permission([environment_id])
    with DBSession() as session:
        board = logic.get_or_create_user_favorite_board(
            current_user.id, environment_id, session=session
        )
        return board.to_dict(extra_fields=["docs", "tables", "boards", "items"])
