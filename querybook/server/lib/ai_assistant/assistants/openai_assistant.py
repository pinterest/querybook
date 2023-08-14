from lib.ai_assistant.base_ai_assistant import BaseAIAssistant
from lib.logger import get_logger

from langchain.chat_models import ChatOpenAI
from langchain.callbacks.manager import CallbackManager
import openai


LOG = get_logger(__file__)


class OpenAIAssistant(BaseAIAssistant):
    """To use it, please set the following environment variable:
    OPENAI_API_KEY: OpenAI API key
    """

    @property
    def name(self) -> str:
        return "openai"

    def _get_error_msg(self, error) -> str:
        if isinstance(error, openai.error.AuthenticationError):
            return "Invalid OpenAI API key"

        return super()._get_error_msg(error)

    def _get_llm(self, callback_handler):
        return ChatOpenAI(
            **self._config,
            streaming=True,
            callback_manager=CallbackManager([callback_handler]),
        )
