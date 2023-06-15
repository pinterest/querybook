from flask_login import current_user

from app.datasource import api_assert
from app.db import with_session
from models.datadoc import DataDoc, DataDocEditor
from const.datasources import (
    UNAUTHORIZED_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
    ACCESS_RESTRICTED_STATUS_CODE,
)

from models import User
from logic.generic_permission import get_all_groups_and_group_members_with_access


class DocDoesNotExist(Exception):
    pass


@with_session
def user_can_write(doc_id, uid, session=None):
    datadoc = session.query(DataDoc).filter_by(id=doc_id).first()
    if datadoc.owner_uid == uid:
        return True

    editor = session.query(DataDocEditor).filter_by(uid=uid, data_doc_id=doc_id).first()
    if editor is not None and editor.write:
        return True

    inherited_editors = get_all_groups_and_group_members_with_access(
        doc_or_board_id=doc_id,
        editor_type=DataDocEditor,
        uid=uid,
        session=session,
    )

    if len(inherited_editors) == 1:
        # Check if the editor's write privileges are true
        if inherited_editors[0][3]:
            return True

    return False


@with_session
def user_can_read(doc_id, uid, session=None):
    # Check if the doc is public or if the user is the owner
    datadoc = session.query(DataDoc).filter_by(id=doc_id).first()
    if datadoc.public or datadoc.owner_uid == uid:
        return True

    # Check if the user has direct read privileges
    editor = session.query(DataDocEditor).filter_by(uid=uid, data_doc_id=doc_id).first()
    if editor is not None and (editor.write or editor.read):
        return True

    # Check if the user has inherited read privileges
    inherited_editors = get_all_groups_and_group_members_with_access(
        doc_or_board_id=doc_id,
        editor_type=DataDocEditor,
        uid=uid,
        session=session,
    )

    if len(inherited_editors) == 1:
        return True

    return False


@with_session
def assert_can_read(doc_id, session=None):
    try:
        api_assert(
            user_can_read(doc_id, uid=current_user.id, session=session),
            "CANNOT_READ_DATADOC",
            UNAUTHORIZED_STATUS_CODE,
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
def assert_is_owner(doc_id, session=None):
    try:
        doc = session.query(DataDoc).filter(DataDoc.id == doc_id).first()
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
def assert_is_not_group(id, session=None):
    editor = session.query(DataDocEditor).filter_by(id=id).first()
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
