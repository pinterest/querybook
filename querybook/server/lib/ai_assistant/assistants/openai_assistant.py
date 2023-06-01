import os

from env import QuerybookSettings
from lib.ai_assistant.base_ai_assistant import BaseAIAssistant
from lib.logger import get_logger

from langchain.chat_models import ChatOpenAI
from langchain.callbacks.manager import CallbackManager

LOG = get_logger(__file__)


class OpenAIAssistant(BaseAIAssistant):
    @property
    def name(self) -> str:
        return "openai"

    def generate_sql_query(self):
        pass

    def generate_title_from_query(self, query, stream=True, callback_handler=None):
        """Generate title from SQL query using OpenAI's chat model."""
        messages = self.title_generation_prompt_template.format_prompt(
            query=query
        ).to_messages()
        chat = ChatOpenAI(
            **self._config,
            streaming=stream,
            callback_manager=CallbackManager([callback_handler]),
        )
        ai_message = chat(messages)
        return ai_message.content
