from app.auth.permission import (
    verify_environment_permission,
    verify_data_doc_permission,
)
from app.flask_app import socketio
from app.db import with_session
from clients.github_client import GitHubClient
from const.data_doc import DATA_DOC_NAMESPACE
from datasources.github import with_github_client
from logic import datadoc as logic
from logic import user as user_logic
from logic.datadoc_permission import assert_can_read, assert_can_write
from flask_login import current_user
from lib.utils.serialize import serialize_value


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
    doc = logic.update_data_doc(
        id=doc_id,
        session=session,
        **fields,
    )
    doc_dict = doc.to_dict()

    socketio.emit(
        "data_doc_updated",
        (
            sid,
            doc_dict,
        ),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
    )

    return doc_dict


@with_session
@with_github_client
def restore_data_doc(
    github_client: GitHubClient,
    datadoc_id: int,
    commit_sha: str,
    commit_message: str,
    sid="",
    session=None,
):
    assert_can_write(datadoc_id, session=session)
    verify_data_doc_permission(datadoc_id, session=session)

    commit_datadoc = github_client.get_datadoc_at_commit(commit_sha)
    restored_datadoc = logic.restore_data_doc_from_commit(
        datadoc_id, commit_datadoc, commit=True, session=session
    )

    user = user_logic.get_user_by_id(current_user.id, session=session)
    assert user is not None, "User does not exist"

    # Emit the restored DataDoc to clients
    socketio.emit(
        "data_doc_restored",
        (
            sid,
            restored_datadoc.to_dict(with_cells=True),
            commit_message,
            user.get_name(),
        ),
        namespace=DATA_DOC_NAMESPACE,
        room=datadoc_id,
    )


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
    data_cell_dict = serialize_value(data_cell.to_dict())
    socketio.emit(
        "data_cell_inserted",
        (
            sid,
            index,
            data_cell_dict,
        ),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
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
        (
            sid,
            from_index,
            to_index,
        ),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
    )

    # Should we return data instead?
    return True


@with_session
def paste_data_cell(
    cell_id: int, cut: bool, doc_id: int, index: int, sid="", session=None
):
    data_cell = logic.get_data_cell_by_id(cell_id, session=session)
    assert data_cell is not None, "Data cell does not exist"

    data_doc = logic.get_data_doc_by_id(doc_id, session=session)
    old_data_doc = data_cell.doc
    same_doc = old_data_doc.id == doc_id
    # Make sure they are in the same environment and have access
    assert (
        old_data_doc.environment_id == data_doc.environment_id
    ), "Must be in the same environment"
    verify_environment_permission([data_doc.environment_id])

    # Users need to be able to write in the doc copied to
    assert_can_write(doc_id, session=session)
    if not same_doc:
        if cut:
            # To cut the user need to be able to write the original doc
            assert_can_write(old_data_doc.id, session=session)
        else:
            # To copy the user need to be able to read the original doc
            assert_can_read(old_data_doc.id, session=session)

    if cut:
        old_cell_index = logic.get_data_doc_data_cell(
            cell_id, session=session
        ).cell_order
        logic.move_data_doc_cell_to_doc(cell_id, doc_id, index, session=session)
        if same_doc:
            # Account for shift in original index
            # See more details in move_data_doc_cell_to_doc
            if old_cell_index < index:
                index -= 1
            socketio.emit(
                "data_cell_moved",
                # sid, from_index, to_index
                (
                    sid,
                    old_cell_index,
                    index,
                ),
                namespace=DATA_DOC_NAMESPACE,
                room=doc_id,
            )
        else:
            socketio.emit(
                "data_cell_inserted",
                (
                    sid,
                    index,
                    data_cell.to_dict(),
                ),
                namespace=DATA_DOC_NAMESPACE,
                room=doc_id,
            )
            socketio.emit(
                "data_cell_deleted",
                (
                    sid,
                    cell_id,
                ),
                namespace=DATA_DOC_NAMESPACE,
                room=old_data_doc.id,
            )
    else:  # Copy
        new_cell_dict = insert_data_cell(
            doc_id,
            index,
            data_cell.cell_type.name,
            data_cell.context,
            data_cell.meta,
            sid,
            session=session,
        )
        # Copy all query history over
        logic.copy_cell_history(cell_id, new_cell_dict["id"], session=session)

    # To resolve the sender's promise
    socketio.emit(
        "data_cell_pasted",
        (sid),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
    )


@with_session
def update_data_cell(cell_id, fields, sid="", session=None):
    data_doc = logic.get_data_doc_by_data_cell_id(cell_id, session=session)
    assert_can_write(data_doc.id, session=session)
    verify_environment_permission([data_doc.environment_id])
    data_cell = logic.update_data_cell(
        id=cell_id,
        session=session,
        **fields,
    )
    data_cell_dict = serialize_value(data_cell.to_dict())
    socketio.emit(
        "data_cell_updated",
        (sid, data_cell_dict),
        namespace=DATA_DOC_NAMESPACE,
        room=data_doc.id,
    )

    return data_cell_dict


@with_session
def delete_data_cell(doc_id, cell_id, sid="", session=None):
    assert_can_write(doc_id, session=session)
    verify_data_doc_permission(doc_id, session=session)
    logic.delete_data_doc_cell(
        data_doc_id=doc_id, data_cell_id=int(cell_id), session=session
    )

    socketio.emit(
        "data_cell_deleted",
        (
            sid,
            cell_id,
        ),
        namespace=DATA_DOC_NAMESPACE,
        room=doc_id,
    )

    return True
