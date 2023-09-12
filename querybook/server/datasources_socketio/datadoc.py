import time
import functools

from flask import request
from flask_login import current_user
from flask_socketio import join_room, leave_room, rooms

from app.auth.permission import verify_environment_permission
from app.flask_app import socketio
from app.db import DBSession
from clients.redis_client import with_redis
from const.data_doc import DATA_DOC_NAMESPACE
from logic import datadoc as logic
from logic import datadoc_collab
from logic.datadoc_permission import assert_can_read
from .helper import register_socket


def to_string(s):
    return s.decode("ascii")


@with_redis
def send_data_doc_session_info(data_doc_id, room, redis_conn=None):
    user_dict = get_and_expire_user_dict(data_doc_id, redis_conn=redis_conn)
    cursor_dict = get_and_expire_cursor_dict(
        data_doc_id, user_dict, redis_conn=redis_conn
    )

    socketio.emit(
        "data_doc_sessions",
        {"users": user_dict, "cursors": cursor_dict},
        namespace=DATA_DOC_NAMESPACE,
        room=room,
    )


@with_redis
def get_and_expire_cursor_dict(data_doc_id, user_dict, redis_conn=None):
    cursor_key = f"data_doc/{data_doc_id}/cursors"
    raw_cursor_dict = redis_conn.hgetall(cursor_key)
    cursor_dict = {}

    for raw_sid, raw_uid in raw_cursor_dict.items():
        sid = to_string(raw_sid)
        if sid in user_dict:
            cursor_dict[sid] = int(raw_uid)
        else:
            # Cursor belongs to a no longer valid session
            redis_conn.hdel(cursor_key, sid)
    return cursor_dict


@with_redis
def get_and_expire_user_dict(data_doc_id, redis_conn=None):
    """Gets entries in data doc users, expire anything more than 5 minutes

    Arguments:
        data_doc_id {[number]}

    Keyword Arguments:
        redis_conn {[Redis]} -- [Redis connection] (default: {None})
    """
    user_key = f"data_doc/{data_doc_id}/users"
    raw_user_dict = redis_conn.hgetall(user_key) or {}
    user_dict = {}
    now = int(time.time())

    for raw_sid, value in raw_user_dict.items():
        sid = to_string(raw_sid)

        values = to_string(value).split("|")
        uid = values[0]
        last_action_time = 0 if len(values) < 2 else int(values[1])

        if now - last_action_time > (5 * 60):  # if last action time is 5 mins ago
            redis_conn.hdel(user_key, sid)
        else:
            user_dict[sid] = int(uid)
    return user_dict


@with_redis
def update_user_list(data_doc_id, add=False, redis_conn=None):
    """Add/Remove user in data doc's redis map

    Arguments:
        data_doc_id {[number]} -- [Id of data doc]

    Keyword Arguments:
        add {bool} -- (default: {False})
    """
    # Update the list of users in This room
    key = f"data_doc/{data_doc_id}/users"
    should_send_info = False

    if add:
        now = int(time.time())
        should_send_info = (
            redis_conn.hset(key, request.sid, f"{current_user.id}|{now}") == 1
        )
    else:
        redis_conn.hdel(key, request.sid)
        should_send_info = True

    if should_send_info:
        socketio.emit(
            "data_doc_user",
            (add, request.sid, current_user.id),
            namespace=DATA_DOC_NAMESPACE,
            room=data_doc_id,
        )


@with_redis
def update_user_cursor(data_doc_id, data_cell_id=None, redis_conn=None):
    """Update the user cursor in redis"""
    key = f"data_doc/{data_doc_id}/cursors"
    if data_cell_id is not None:
        redis_conn.hset(key, request.sid, data_cell_id)
    else:
        redis_conn.hdel(key, request.sid)


def data_doc_socket(fn):
    """
    If it is a data_doc_socket,
    The first argument must be the doc Id.
    It will then refresh the user's session.
    """

    @functools.wraps(fn)
    def handler(*args, **kwargs):
        try:
            data_doc_id = args[0] if len(args) > 0 else None
            if data_doc_id is not None:
                update_user_list(data_doc_id, add=True)
        except Exception:
            pass  # Ignore so the normal func would operate as usual
        return fn(*args, **kwargs)

    handler.__raw__ = fn
    return handler


@register_socket("subscribe", namespace=DATA_DOC_NAMESPACE)
def on_join_room(data_doc_id: str):
    data_doc_id = int(data_doc_id)
    with DBSession() as session:
        assert_can_read(data_doc_id, session=session)
        data_doc = logic.get_data_doc_by_id(data_doc_id, session=session)
        verify_environment_permission([data_doc.environment_id])

        join_room(data_doc_id)
        update_user_list(data_doc_id, add=True)


@register_socket("unsubscribe", namespace=DATA_DOC_NAMESPACE)
def on_leave_room(data_doc_id):
    data_doc_id = int(data_doc_id)
    leave_room(data_doc_id)
    # Update the list of users in This room
    update_user_list(data_doc_id)
    update_user_cursor(data_doc_id)


@register_socket("disconnect", namespace=DATA_DOC_NAMESPACE)
def disconnect():
    data_doc_ids = rooms(request.sid, namespace=DATA_DOC_NAMESPACE)
    for data_doc_id in data_doc_ids:
        leave_room(data_doc_id)
        update_user_list(data_doc_id)


@register_socket("fetch_data_doc_editors", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def fetch_data_doc_editors(doc_id):
    with DBSession() as session:
        doc = datadoc_collab.get_datadoc(doc_id, session=session)
        if doc:
            editors = logic.get_data_doc_editors_by_doc_id(doc_id, session=session)
            editor_dicts = [editor.to_dict() for editor in editors]
            socketio.emit(
                "data_doc_editors",
                (request.sid, editor_dicts),
                namespace=DATA_DOC_NAMESPACE,
                room=request.sid,
            )
            send_data_doc_session_info(doc_id, room=request.sid)


@register_socket("fetch_data_doc_access_requests", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def fetch_data_doc_access_requests(doc_id):
    with DBSession() as session:
        doc = datadoc_collab.get_datadoc(doc_id, session=session)
        if doc:
            access_requests = logic.get_data_doc_access_requests_by_doc_id(
                doc_id, session=session
            )
            access_request_dicts = [
                access_request.to_dict() for access_request in access_requests
            ]
            socketio.emit(
                "data_doc_access_requests",
                (request.sid, access_request_dicts),
                namespace=DATA_DOC_NAMESPACE,
                room=request.sid,
            )
            send_data_doc_session_info(doc_id, room=request.sid)


@register_socket("update_data_doc", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def update_data_doc(id, fields):
    datadoc_collab.update_datadoc(id, fields, sid=request.sid)


@register_socket("update_data_cell", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def update_data_cell(doc_id, cell_id, fields):
    datadoc_collab.update_data_cell(cell_id, fields, sid=request.sid)


@register_socket("delete_data_cell", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def delete_data_cell(doc_id, cell_id):
    datadoc_collab.delete_data_cell(doc_id, cell_id, sid=request.sid)


@register_socket("move_data_cell", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def move_data_cell(doc_id, from_index, to_index):
    datadoc_collab.move_data_cell(doc_id, from_index, to_index, sid=request.sid)


@register_socket("paste_data_cell", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def paste_data_cell(cell_id, cut, doc_id, index):
    datadoc_collab.paste_data_cell(cell_id, cut, doc_id, index, sid=request.sid)


@register_socket("insert_data_cell", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def insert_data_cell(doc_id, index, cell_type, context, meta):
    datadoc_collab.insert_data_cell(
        doc_id, index, cell_type, context, meta, sid=request.sid
    )


@register_socket("move_data_doc_cursor", namespace=DATA_DOC_NAMESPACE)
@data_doc_socket
def move_data_doc_cursor(data_doc_id, data_cell_id=None):
    update_user_cursor(data_doc_id, data_cell_id)
    socketio.emit(
        "data_doc_cursor_moved",
        (
            request.sid,
            data_cell_id,
        ),
        namespace=DATA_DOC_NAMESPACE,
        room=data_doc_id,
    )
