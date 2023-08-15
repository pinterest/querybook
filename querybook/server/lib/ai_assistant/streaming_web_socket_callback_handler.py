from flask import request
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from const.ai_assistant import (
    AI_ASSISTANT_NAMESPACE,
    AI_ASSISTANT_RESPONSE_EVENT,
)


class WebSocketStream:
    def __init__(self, socketio, command_type: str):
        self.socketio = socketio
        self.command_type = command_type
        self.room = request.sid

    def _send(self, payload: dict):
        self.socketio.emit(
            AI_ASSISTANT_RESPONSE_EVENT,
            (
                self.command_type,
                payload,
            ),
            namespace=AI_ASSISTANT_NAMESPACE,
            room=self.room,
        )

    def send(self, data: str):
        self._send(
            {
                "event": "data",
                "data": data,
            }
        )

    def send_error(self, error: str):
        self._send(
            {
                "event": "error",
                "data": error,
            }
        )
        self.close()

    def close(self):
        self._send(
            {
                "event": "close",
            }
        )


class StreamingWebsocketCallbackHandler(StreamingStdOutCallbackHandler):
    """Callback handlder to stream the result through web socket."""

    def __init__(self, stream: WebSocketStream):
        super().__init__()
        self.stream = stream

    def on_llm_new_token(self, token: str, **kwargs):
        self.stream.send(token)

    def on_llm_end(self, response, **kwargs):
        self.stream.close()
