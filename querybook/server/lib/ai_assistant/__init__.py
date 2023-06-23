from env import QuerybookSettings


if QuerybookSettings.AI_ASSISTANT_PROVIDER:
    from .ai_assistant import AIAssistant

    ai_assistant = AIAssistant(
        QuerybookSettings.AI_ASSISTANT_PROVIDER, QuerybookSettings.AI_ASSISTANT_CONFIG
    )
else:
    ai_assistant = None
