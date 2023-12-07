from flask_login import current_user

from app.datasource import api_assert
from app.db import with_session
from models.board import Board, BoardEditor
from const.datasources import (
    ACCESS_RESTRICTED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)

from models import User
from logic.generic_permission import user_has_permission


class BoardDoesNotExist(Exception):
    pass


@with_session
def user_can_edit(board_id, uid, session=None):
    board = session.query(Board).filter_by(id=board_id).first()

    if board is None:
        raise BoardDoesNotExist()

    if board.owner_uid == uid:
        return True

    return user_has_permission(board_id, "write", BoardEditor, uid, session=session)


@with_session
def user_can_read(board_id, uid, session=None):
    board = session.query(Board).filter_by(id=board_id).first()

    if board is None:
        raise BoardDoesNotExist()

    if board.public or board.owner_uid == uid:
        return True

    return user_has_permission(board_id, "read", BoardEditor, uid, session=session)


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


@with_session
def assert_is_not_group(id, session=None):
    editor = session.query(BoardEditor).filter_by(id=id).first()
    if editor is None:
        api_assert(False, "EDITOR_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
    user = session.query(User).filter_by(id=editor.uid).first()
    if user is None:
        api_assert(False, "USER_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
    api_assert(
        user.is_group is False,
        "GROUP CANNOT BE ASSIGNED AS OWNER",
        ACCESS_RESTRICTED_STATUS_CODE,
    )
