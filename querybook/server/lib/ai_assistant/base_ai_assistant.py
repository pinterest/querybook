from abc import ABC, abstractmethod
import functools
import queue

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from pydantic.error_wrappers import ValidationError

from lib.logger import get_logger

LOG = get_logger(__file__)


class EventStream:
    """Generator to facilitate streaming result from Langchain.
    The stream format is based on Server-Sent Events (SSE)."""

    def __init__(self):
        self.queue = queue.Queue()

    def __iter__(self):
        return self

    def __next__(self):
        item = self.queue.get()
        if item is StopIteration:
            raise item
        return item

    def send(self, data: str):
        self.queue.put("data: " + data + "\n\n")

    def close(self):
        # the empty data is to make sure the client receives the close event
        self.queue.put("event: close\ndata: \n\n")
        self.queue.put(StopIteration)

    def send_error(self, error: str):
        self.queue.put("event: error\n")
        self.queue.put(f"data: {error}\n\n")
        self.close()


class ChainStreamHandler(StreamingStdOutCallbackHandler):
    """Callback handlder to stream the result to a generator."""

    def __init__(self, stream: EventStream):
        super().__init__()
        self.stream = stream

    def on_llm_new_token(self, token: str, **kwargs):
        self.stream.send(token)

    def on_llm_end(self, response, **kwargs):
        self.stream.close()


class BaseAIAssistant(ABC):
    @property
    def name(self) -> str:
        raise NotImplementedError()

    def set_config(self, config: dict):
        self._config = config

    def catch_error(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            try:
                return func(self, *args, **kwargs)
            except Exception as e:
                LOG.error(e, exc_info=True)
                err_msg = self._get_error_msg(e)
                callback_handler = kwargs.get("callback_handler")
                if callback_handler:
                    callback_handler.stream.send_error(err_msg)
                else:
                    raise Exception(err_msg) from e

        return wrapper

    def _get_error_msg(self, error) -> str:
        """Override this method to return specific error messages for your own assistant."""
        if isinstance(error, ValidationError):
            return error.errors()[0].get("msg")

        return str(error.args[0])

    @abstractmethod
    def generate_sql_query(
        self, metastore_id: int, query_engine_id: int, question: str, tables: list[str]
    ):
        raise NotImplementedError()

    @catch_error
    def generate_title_from_query(
        self,
        query,
        stream=True,
        callback_handler: ChainStreamHandler = None,
        user_id=None,
    ):
        """Generate title from SQL query.

        Args:
            query (str): SQL query
            stream (bool, optional): Whether to stream the result. Defaults to True.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Required if stream is True.
        """
        return self._generate_title_from_query(
            query=query,
            stream=stream,
            callback_handler=callback_handler,
            user_id=user_id,
        )

    @abstractmethod
    def _generate_title_from_query(
        self,
        query,
        stream,
        callback_handler,
        user_id=None,
    ):
        raise NotImplementedError()
