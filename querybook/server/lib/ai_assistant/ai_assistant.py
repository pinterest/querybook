import threading

from .all_ai_assistants import get_ai_assistant_class
from .base_ai_assistant import ChainStreamHandler, EventStream


class AIAssistant:
    def __init__(self, provider: str, config: dict = {}):
        self._assisant = get_ai_assistant_class(provider)
        self._assisant.set_config(config)

    def _get_streaming_result(self, fn, kwargs):
        event_stream = EventStream()
        callback_handler = ChainStreamHandler(event_stream)
        kwargs["callback_handler"] = callback_handler
        thread = threading.Thread(target=fn, kwargs=kwargs)
        thread.start()
        return event_stream

    def generate_title_from_query(self, query, user_id=None):
        return self._get_streaming_result(
            self._assisant.generate_title_from_query,
            {"query": query, "user_id": user_id},
        )

    def query_auto_fix(self, query_execution_id, user_id=None):
        return self._get_streaming_result(
            self._assisant.query_auto_fix,
            {
                "query_execution_id": query_execution_id,
                "user_id": user_id,
            },
        )

    def generate_sql_query(
        self,
        query_engine_id: int,
        tables: list[str],
        question: str,
        data_cell_id: int = None,
        user_id=None,
    ):
        return self._get_streaming_result(
            self._assisant.generate_sql_query,
            {
                "query_engine_id": query_engine_id,
                "tables": tables,
                "question": question,
                "data_cell_id": data_cell_id,
                "user_id": user_id,
            },
        )
