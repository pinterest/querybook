from const.ai_assistant import (
    AI_ASSISTANT_NAMESPACE,
    AI_ASSISTANT_REQUEST_EVENT,
)

from .helper import register_socket


@register_socket(AI_ASSISTANT_REQUEST_EVENT, namespace=AI_ASSISTANT_NAMESPACE)
def ai_assistant_request(command_type: str, payload={}):
    from lib.ai_assistant import ai_assistant

    ai_assistant.handle_ai_command(command_type, payload)
