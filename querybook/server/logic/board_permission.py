from flask_login import current_user

from app.datasource import api_assert
from app.db import with_session
from models.board import Board, BoardEditor
from const.datasources import (
    ACCESS_RESTRICTED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)
from const.permissions import BoardDataDocPermission

from logic.generic_permission import user_has_permission


class BoardDoesNotExist(Exception):
    pass


@with_session
def user_can_edit(board_id, uid, session=None):
    board = session.query(Board).get(board_id)

    if board is None:
        raise BoardDoesNotExist()

    if board.owner_uid == uid:
        return True

    return user_has_permission(
        board_id, BoardDataDocPermission.WRITE, BoardEditor, uid, session=session
    )


@with_session
def user_can_read(board_id, uid, session=None):
    board = session.query(Board).get(board_id)

    if board is None:
        raise BoardDoesNotExist()

    if board.public or board.owner_uid == uid:
        return True

    return user_has_permission(
        board_id, BoardDataDocPermission.READ, BoardEditor, uid, session=session
    )


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
        board = session.query(Board).get(board_id)
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
def assert_is_not_group(board_editor_id, session=None):
    editor = session.query(BoardEditor).get(board_editor_id)
    if editor is None:
        api_assert(False, "EDITOR_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
    api_assert(
        editor.user.is_group is False or editor.user.is_group is None,
        "Group cannot be assigned as owner",
        ACCESS_RESTRICTED_STATUS_CODE,
    )
