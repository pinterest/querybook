from app.auth.permission import (
    verify_environment_permission,
    verify_data_doc_permission,
)
from app.flask_app import socketio
from app.db import with_session

from logic import datadoc as logic
from logic.datadoc_permission import assert_can_read, assert_can_write

DATA_DOC_NAMESPACE = "/datadoc"


@with_session
def get_datadoc(doc_id, session=None):
    assert_can_read(doc_id, session=session)
    doc = logic.get_data_doc_by_id(id=doc_id, session=session)
    if doc:
        verify_environment_permission([doc.environment_id])
        return doc.to_dict(with_cells=True)


@with_session
def update_datadoc(doc_id, fields, sid="", session=None):
    # Check to see if author has permission
    assert_can_write(doc_id, session=session)
    verify_data_doc_permission(doc_id, session=session)
    doc = logic.update_data_doc(id=doc_id, session=session, **fields,)
    doc_dict = doc.to_dict()

    socketio.emit(
        "data_doc_updated",
        (sid, doc_dict,),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
        broadcast=True,
    )

    return doc_dict


@with_session
def insert_data_cell(
    doc_id, index, cell_type, context=None, meta=None, sid="", session=None
):
    assert_can_write(doc_id, session=session)
    verify_data_doc_permission(doc_id, session=session)

    data_cell = logic.create_data_cell(
        cell_type=cell_type, context=context, meta=meta, commit=False, session=session
    )
    logic.insert_data_doc_cell(
        data_doc_id=doc_id, cell_id=data_cell.id, index=index, session=session
    )
    data_cell_dict = data_cell.to_dict()
    socketio.emit(
        "data_cell_inserted",
        (sid, index, data_cell_dict,),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
        broadcast=True,
    )

    return data_cell_dict


@with_session
def move_data_cell(doc_id, from_index, to_index, sid="", session=None):
    assert_can_write(doc_id, session=session)
    verify_data_doc_permission(doc_id, session=session)
    logic.move_data_doc_cell(
        data_doc_id=doc_id,
        from_index=int(from_index),
        to_index=int(to_index),
        session=session,
    )

    socketio.emit(
        "data_cell_moved",
        (sid, from_index, to_index,),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
        broadcast=True,
    )

    # Should we return data instead?
    return True


@with_session
def update_data_cell(cell_id, fields, sid="", session=None):
    data_cell = logic.update_data_cell(
        id=cell_id, session=session, commit=False, **fields,
    )

    data_doc = data_cell.doc
    assert_can_write(data_doc.id, session=session)
    verify_environment_permission([data_doc.environment_id])
    session.commit()

    data_cell_dict = data_cell.to_dict()
    socketio.emit(
        "data_cell_updated",
        (sid, data_cell_dict),
        namespace=DATA_DOC_NAMESPACE,
        room=data_doc.id,
        broadcast=True,
    )

    return data_cell_dict


@with_session
def delete_data_cell(doc_id, index, sid="", session=None):
    assert_can_write(doc_id, session=session)
    verify_data_doc_permission(doc_id, session=session)
    logic.delete_data_doc_cell(data_doc_id=doc_id, index=int(index), session=session)

    socketio.emit(
        "data_cell_deleted",
        (sid, index,),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
        broadcast=True,
    )

    return True
