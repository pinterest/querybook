from langchain_aws import ChatBedrock

from lib.ai_assistant.base_ai_assistant import BaseAIAssistant
from lib.logger import get_logger

LOG = get_logger(__file__)

BEDROCK_MODEL_CONTEXT_WINDOW_SIZE = {
    "amazon.nova-pro-v1:0": 300_000,
    "amazon.nova-lite-v1:0": 300_000,
    "amazon.nova-micro-v1:0": 128_000,
    "anthropic.claude-3-5-sonnet-20241022-v2:0": 200_000,
    "anthropic.claude-3-5-haiku-20241022-v1:0": 200_000,
    "anthropic.claude-3-opus-20240229-v1:0": 200_000,
    "anthropic.claude-3-sonnet-20240229-v1:0": 200_000,
    "anthropic.claude-3-haiku-20240307-v1:0": 200_000,
    "meta.llama3-70b-instruct-v1:0": 128_000,
    "meta.llama3-8b-instruct-v1:0": 8_000,
    "mistral.mistral-large-2402-v1:0": 32_000,
}
DEFAULT_MODEL_ID = "anthropic.claude-3-5-haiku-20241022-v1:0"
DEFAULT_CONTEXT_LENGTH = 200_000


class BedrockAIAssistant(BaseAIAssistant):
    """AWS Bedrock AI Assistant.

    Uses standard boto3 credentials (IAM role, environment variables, or
    ~/.aws/credentials). No additional configuration is required when running
    on AWS infrastructure with an appropriate IAM role attached.

    Optional configuration (via model_args in assistant config):
        model_id: Bedrock model ID (default: anthropic.claude-3-5-haiku-20241022-v1:0)
        region_name: AWS region (default: boto3 default region)
    """

    @property
    def name(self) -> str:
        return "bedrock"

    def _get_context_length_by_model(self, model_name: str) -> int:
        return BEDROCK_MODEL_CONTEXT_WINDOW_SIZE.get(model_name, DEFAULT_CONTEXT_LENGTH)

    def _get_default_llm_config(self):
        default_config = super()._get_default_llm_config()
        if not default_config.get("model_id"):
            default_config["model_id"] = DEFAULT_MODEL_ID
        return default_config

    def _get_token_count(self, ai_command: str, prompt: str) -> int:
        # Approximation: ~4 characters per token
        return len(prompt) // 4

    def _get_llm(self, ai_command: str, prompt_length: int):
        config = self._get_llm_config(ai_command)
        model_id = config.get("model_id", DEFAULT_MODEL_ID)
        region_name = config.get("region_name")

        kwargs = {"model_id": model_id}
        if region_name:
            kwargs["region_name"] = region_name

        return ChatBedrock(**kwargs)
