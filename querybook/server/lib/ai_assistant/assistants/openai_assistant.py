import openai
import tiktoken
from langchain.callbacks.manager import CallbackManager
from langchain.chat_models import ChatOpenAI

from lib.ai_assistant.base_ai_assistant import BaseAIAssistant
from lib.logger import get_logger

LOG = get_logger(__file__)


class OpenAIAssistant(BaseAIAssistant):
    """To use it, please set the following environment variable:
    OPENAI_API_KEY: OpenAI API key
    """

    @property
    def name(self) -> str:
        return "openai"

    def _get_token_count(self, ai_command: str, prompt: str) -> int:
        model_name = self._get_llm_config(ai_command).get("model_name")
        encoding = tiktoken.encoding_for_model(model_name)
        return len(encoding.encode(prompt))

    def _get_error_msg(self, error) -> str:
        if isinstance(error, openai.error.AuthenticationError):
            return "Invalid OpenAI API key"

        return super()._get_error_msg(error)

    def _get_llm(self, ai_command: str, callback_handler=None):
        config = self._get_llm_config(ai_command)
        if not callback_handler:
            # non-streaming
            return ChatOpenAI(**config)

        return ChatOpenAI(
            **config,
            streaming=True,
            callback_manager=CallbackManager([callback_handler])
        )
