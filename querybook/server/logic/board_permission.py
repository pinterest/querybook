from flask_login import current_user

from app.datasource import api_assert
from app.db import with_session
from models.board import Board


class BoardDoesNotExist(Exception):
    pass


@with_session
def user_can_edit(board_id, uid, session=None):
    board = Board.get(id=board_id, session=session)

    if board is None:
        raise BoardDoesNotExist()

    if board.owner_uid == uid:
        return True

    # TODO: Update with edit permissions
    return False


@with_session
def user_can_read(board_id, uid, session=None):
    board = Board.get(id=board_id, session=session)

    if board is None:
        raise BoardDoesNotExist()

    if board.public:
        return True

    if board.owner_uid == uid:
        return True

    # TODO: Update with read permissions (not public but can read)
    return False


@with_session
def assert_can_edit(board_id, session=None):
    try:
        api_assert(
            user_can_edit(board_id, uid=current_user.id, session=session),
            "CANNOT_EDIT_BOARD",
            403,
        )
    except BoardDoesNotExist:
        api_assert(False, "BOARD_DNE", 404)


@with_session
def assert_can_read(board_id, session=None):
    try:
        api_assert(
            user_can_read(board_id, uid=current_user.id, session=session),
            "CANNOT_READ_BOARD",
            403,
        )
    except BoardDoesNotExist:
        api_assert(False, "BOARD_DNE", 404)
