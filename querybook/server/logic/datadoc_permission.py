from flask_login import current_user

from app.datasource import api_assert
from app.db import with_session
from models.datadoc import DataDoc, DataDocEditor
from const.datasources import (
    UNAUTHORIZED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
    ACCESS_RESTRICTED_STATUS_CODE,
)
from const.permissions import BoardDataDocPermission

from logic.generic_permission import user_has_permission


class DocDoesNotExist(Exception):
    pass


@with_session
def user_can_write(doc_id, uid, session=None):
    datadoc = session.query(DataDoc).get(doc_id)

    if datadoc is None:
        raise DocDoesNotExist()

    if datadoc.owner_uid == uid:
        return True

    return user_has_permission(
        doc_id, BoardDataDocPermission.WRITE, DataDocEditor, uid, session=session
    )


@with_session
def user_can_read(doc_id, uid, session=None):
    # Check if the doc is public or if the user is the owner
    datadoc = session.query(DataDoc).get(doc_id)

    if datadoc is None:
        raise DocDoesNotExist()

    if datadoc.public or datadoc.owner_uid == uid:
        return True

    return user_has_permission(
        doc_id, BoardDataDocPermission.READ, DataDocEditor, uid, session=session
    )


@with_session
def user_can_execute(doc_id, uid, session=None):
    datadoc = session.query(DataDoc).filter_by(id=doc_id).first()

    if datadoc is None:
        raise DocDoesNotExist()

    if datadoc.owner_uid == uid:
        return True

    return user_has_permission(
        doc_id, BoardDataDocPermission.EXECUTE, DataDocEditor, uid, session=session
    )


@with_session
def assert_can_read(doc_id, session=None):
    try:
        api_assert(
            user_can_read(doc_id, uid=current_user.id, session=session),
            "CANNOT_READ_DATADOC",
            ACCESS_RESTRICTED_STATUS_CODE,
        )
    except DocDoesNotExist:
        api_assert(False, "DOC_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)


@with_session
def assert_can_write(doc_id, session=None):
    try:
        api_assert(
            user_can_write(doc_id, uid=current_user.id, session=session),
            "CANNOT_WRITE_DATADOC",
            UNAUTHORIZED_STATUS_CODE,
        )
    except DocDoesNotExist:
        api_assert(False, "DOC_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)


@with_session
def assert_can_execute(doc_id, session=None):
    try:
        api_assert(
            user_can_execute(doc_id, uid=current_user.id, session=session),
            "CANNOT_EXECUTE_DATADOC",
            UNAUTHORIZED_STATUS_CODE,
        )
    except DocDoesNotExist:
        api_assert(False, "DOC_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)


@with_session
def assert_is_owner(doc_id, session=None):
    try:
        doc = session.query(DataDoc).get(doc_id)
        if doc is None:
            raise DocDoesNotExist
        api_assert(
            doc.owner_uid == current_user.id,
            "NOT_DATADOC_OWNER",
            UNAUTHORIZED_STATUS_CODE,
        )
    except DocDoesNotExist:
        api_assert(False, "DOC_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)


@with_session
def assert_is_not_group(editor_id, session=None):
    editor = session.query(DataDocEditor).get(editor_id)
    if editor is None:
        api_assert(False, "EDITOR_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
    api_assert(
        editor.user.is_group is False or editor.user.is_group is None,
        "Group cannot be assigned as owner",
        ACCESS_RESTRICTED_STATUS_CODE,
    )
