from abc import ABC, abstractmethod

import queue

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler


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

    def __init__(self, gen: ThreadedGenerator):
        super().__init__()
        self.gen = gen

    def on_llm_new_token(self, token: str, **kwargs):
        self.gen.send(token)

    def on_llm_end(self, response, **kwargs):
        self.gen.send(StopIteration)
        self.gen.close()


class BaseAIAssistant(ABC):
    @property
    def name(self) -> str:
        raise NotImplementedError()

    def set_config(self, config: dict):
        self._config = config

    @abstractmethod
    def generate_sql_query(
        self, metastore_id: int, query_engine_id: int, question: str, tables: list[str]
    ):
        raise NotImplementedError()

    @abstractmethod
    def generate_title_from_query(
        self, query, stream=False, callback_handler: ChainStreamHandler = None
    ):
        """Generate title from SQL query.

        Args:
            query (str): SQL query
            stream (bool, optional): Whether to stream the result. Defaults to False.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Defaults to None.
        """
        raise NotImplementedError()
