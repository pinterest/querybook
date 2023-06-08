import threading

from flask_login import current_user

from .all_ai_assistants import get_ai_assistant_class
from .base_ai_assistant import ThreadedGenerator, ChainStreamHandler


class AIAssistant:
    def __init__(self, provider: str, config: dict = {}):
        self._assisant = get_ai_assistant_class(provider)
        self._assisant.set_config(config)

    @property
    def current_user_id(self):
        return current_user.id if current_user else None

    def _get_streaming_result(self, fn, kwargs):
        g = ThreadedGenerator()
        callback_handler = ChainStreamHandler(g)
        kwargs["callback_handler"] = callback_handler
        thread = threading.Thread(target=fn, kwargs=kwargs)
        thread.start()
        return g

    def generate_title_from_query(self, query):
        return self._get_streaming_result(
            self._assisant.generate_title_from_query,
            {"query": query, "user_id": self.current_user_id},
        )
