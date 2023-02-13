from flask_login import current_user
from sqlalchemy import and_

from app.datasource import api_assert
from app.db import with_session
from models.datadoc import DataDoc, DataDocEditor
from const.datasources import UNAUTHORIZED_STATUS_CODE, RESOURCE_NOT_FOUND_STATUS_CODE


class DocDoesNotExist(Exception):
    pass


@with_session
def user_can_write(doc_id, uid, session=None):
    doc, editor = session.query(DataDoc, DataDocEditor).outerjoin(
        DataDocEditor,
        and_(DataDoc.id == DataDocEditor.data_doc_id, DataDocEditor.uid == uid),
    ).filter(DataDoc.id == doc_id).first() or (None, None)

    if doc is None:
        raise DocDoesNotExist()

    if doc.owner_uid == uid:
        return True

    return editor is not None and editor.write


@with_session
def user_can_read(doc_id, uid, session=None):
    doc, editor = session.query(DataDoc, DataDocEditor).outerjoin(
        DataDocEditor,
        and_(DataDoc.id == DataDocEditor.data_doc_id, DataDocEditor.uid == uid),
    ).filter(DataDoc.id == doc_id).first() or (None, None)

    if doc is None:
        raise DocDoesNotExist()

    if doc.public or doc.owner_uid == uid:
        return True

    return editor is not None and (editor.read or editor.write)


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
