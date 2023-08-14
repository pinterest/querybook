from langchain.memory.chat_message_histories import RedisChatMessageHistory


class RedisChatHistoryStorage(RedisChatMessageHistory):
    """Chat message history stored in a Redis database."""

    def __init__(
        self,
        redis_client,
        session_id: str,
        key_prefix: str = "message_store:",
        ttl=600,
    ):
        self.redis_client = redis_client
        self.session_id = session_id
        self.key_prefix = key_prefix
        self.ttl = ttl
