import functools

from flask import request

from app.flask_app import socketio
from const.ai_assistant import AI_ASSISTANT_NAMESPACE, AICommandType


class AIWebSocket:
    def __init__(self, socketio, command_type: AICommandType):
        self.socketio = socketio
        self.command_type = command_type
        self.room = request.sid

    def _send(self, event_type, payload: dict = None):
        self.socketio.emit(
            self.command_type.value,
            (
                event_type,
                payload,
            ),
            namespace=AI_ASSISTANT_NAMESPACE,
            room=self.room,
        )

    def send_data(self, data: dict):
        self._send("data", data)

    def send_tables_for_sql_gen(self, data: list[str]):
        self._send("tables", data)

    def send_error(self, error: str):
        self._send("error", error)
        self.close()

    def close(self):
        self._send("close")


def with_ai_socket(command_type: AICommandType):
    def decorator_fn(fn):
        @functools.wraps(fn)
        def func(*args, **kwargs):
            if not kwargs.get("socket"):
                kwargs["socket"] = AIWebSocket(socketio, command_type)

            result = fn(*args, **kwargs)

            return result

        return func

    return decorator_fn
