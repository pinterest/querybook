from flask import request
from flask_socketio import join_room, leave_room

from const.ai_assistant import (
    AI_ASSISTANT_NAMESPACE,
    AI_ASSISTANT_REQUEST_EVENT,
)

from .helper import register_socket


@register_socket("subscribe", namespace=AI_ASSISTANT_NAMESPACE)
def on_join_room():
    join_room(request.sid)


@register_socket("unsubscribe", namespace=AI_ASSISTANT_NAMESPACE)
def on_leave_room():
    leave_room(request.sid)


@register_socket("disconnect", namespace=AI_ASSISTANT_NAMESPACE)
def disconnect():
    leave_room(request.sid)


@register_socket(AI_ASSISTANT_REQUEST_EVENT, namespace=AI_ASSISTANT_NAMESPACE)
def ai_assistant_request(command_type: str, payload={}):
    from lib.ai_assistant import ai_assistant

    ai_assistant.handle_ai_command(command_type, payload)
