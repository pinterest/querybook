import threading
import queue

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from env import QuerybookSettings

from .base_ai_assistant import BaseAIAssistant
from .all_ai_assistants import get_ai_assistant_class


class ThreadedGenerator:
    """Generator to facilitate streaming result from Langchain."""

    def __init__(self):
        self.queue = queue.Queue()

    def __iter__(self):
        return self

    def __next__(self):
        item = self.queue.get()
        if item is StopIteration:
            raise item
        return item

    def send(self, data):
        self.queue.put(data)

    def close(self):
        self.queue.put(StopIteration)


class ChainStreamHandler(StreamingStdOutCallbackHandler):
    """Callback handlder to stream the result to a generator."""

    def __init__(self, gen):
        super().__init__()
        self.gen = gen

    def on_llm_new_token(self, token: str, **kwargs):
        self.gen.send(token)

    def on_llm_end(self, response, **kwargs):
        self.gen.send(StopIteration)
        self.gen.close()


class AIAssistant:
    def __init__(self):
        self._assisant = get_ai_assistant_class(QuerybookSettings.AI_ASSISTANT_NAME)

    def _get_streaming_result(self, fn, kwargs):
        g = ThreadedGenerator()
        callback_handler = ChainStreamHandler(g)
        kwargs["callback_handler"] = callback_handler
        thread = threading.Thread(target=fn, kwargs=kwargs)
        thread.start()
        return g

    def generate_title_from_query(self, query, stream=True):
        if stream:
            return self._get_streaming_result(
                self._assisant.generate_title_from_query,
                {"query": query, "stream": stream},
            )
        else:
            return self._assisant.generate_title_from_query(query, stream)
