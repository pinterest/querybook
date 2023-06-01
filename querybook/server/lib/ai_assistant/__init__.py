from lib.config import get_config_value

AI_ASSISTANT_CONFIG = get_config_value("ai_assistant", {})

provider = AI_ASSISTANT_CONFIG.get("provider")

if provider:
    from .ai_assistant import AIAssistant

    ai_assistant = AIAssistant(provider, AI_ASSISTANT_CONFIG.get("config", {}))
else:
    ai_assistant = None
