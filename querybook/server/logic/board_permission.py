from flask_login import current_user

from app.datasource import api_assert
from app.db import with_session
from models.board import Board, BoardEditor
from const.datasources import (
    ACCESS_RESTRICTED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)


class BoardDoesNotExist(Exception):
    pass


@with_session
def user_can_edit(board_id, uid, session=None):
    board = session.query(Board).get(board_id)

    if board is None:
        raise BoardDoesNotExist()

    if board.owner_uid == uid:
        return True

    editor = (
        session.query(BoardEditor)
        .filter(BoardEditor.board_id == board_id)
        .filter(BoardEditor.uid == uid)
        .first()
    )

    return editor is not None and editor.write


@with_session
def user_can_read(board_id, uid, session=None):
    board = session.query(Board).get(board_id)

    if board is None:
        raise BoardDoesNotExist()

    if board.public:
        return True

    if board.owner_uid == uid:
        return True

    editor = (
        session.query(BoardEditor)
        .filter(BoardEditor.board_id == board_id)
        .filter(BoardEditor.uid == uid)
        .first()
    )

    return editor is not None and (editor.read or editor.write)


@with_session
def assert_can_edit(board_id, session=None):
    try:
        api_assert(
            user_can_edit(board_id, uid=current_user.id, session=session),
            "CANNOT_EDIT_BOARD",
            ACCESS_RESTRICTED_STATUS_CODE,
        )
    except BoardDoesNotExist:
        api_assert(False, "BOARD_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)


@with_session
def assert_can_read(board_id, session=None):
    try:
        api_assert(
            user_can_read(board_id, uid=current_user.id, session=session),
            "CANNOT_READ_BOARD",
            ACCESS_RESTRICTED_STATUS_CODE,
        )
    except BoardDoesNotExist:
        api_assert(False, "BOARD_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)


@with_session
def assert_is_owner(board_id, session=None):
    try:
        board = session.query(Board).filter(Board.id == board_id).first()
        if board is None:
            raise BoardDoesNotExist
        api_assert(
            board.owner_uid == current_user.id,
            "NOT_BOARD_OWNER",
            ACCESS_RESTRICTED_STATUS_CODE,
        )
    except BoardDoesNotExist:
        api_assert(False, "BOARD_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
