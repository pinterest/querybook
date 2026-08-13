import os

import tiktoken
from langchain_ollama import ChatOllama

from lib.ai_assistant.base_ai_assistant import BaseAIAssistant
from lib.logger import get_logger

LOG = get_logger(__file__)

DEFAULT_MODEL_NAME = "llama3.2"
DEFAULT_CONTEXT_LENGTH = 4096


class OllamaAIAssistant(BaseAIAssistant):
    """Ollama AI Assistant for locally hosted models.

    Required environment variable:
        OLLAMA_BASE_URL: Base URL of the Ollama server (e.g. http://localhost:11434)

    Optional configuration (via model_args in assistant config):
        model_name: Ollama model to use (default: llama3.2)
        base_url: Alternative to OLLAMA_BASE_URL env var
    """

    @property
    def name(self) -> str:
        return "ollama"

    def _get_context_length_by_model(self, model_name: str) -> int:
        return DEFAULT_CONTEXT_LENGTH

    def _get_default_llm_config(self):
        default_config = super()._get_default_llm_config()
        if not default_config.get("model_name"):
            default_config["model_name"] = DEFAULT_MODEL_NAME
        return default_config

    def _get_token_count(self, ai_command: str, prompt: str) -> int:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(prompt))

    def _get_llm(self, ai_command: str, prompt_length: int):
        config = self._get_llm_config(ai_command)
        model = config.get("model_name", DEFAULT_MODEL_NAME)
        base_url = os.environ.get("OLLAMA_BASE_URL") or config.get(
            "base_url", "http://localhost:11434"
        )

        return ChatOllama(model=model, base_url=base_url)
