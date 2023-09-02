from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from .ai_socket import AIWebSocket


class StreamingWebsocketCallbackHandler(StreamingStdOutCallbackHandler):
    """Callback handlder to stream the result through web socket."""

    def __init__(self, socket: AIWebSocket):
        super().__init__()
        self.socket = socket

    def on_llm_new_token(self, token: str, **kwargs):
        self.socket.send_delta_data(token)

    def on_llm_end(self, response, **kwargs):
        self.socket.send_delta_end()
        self.socket.close()
