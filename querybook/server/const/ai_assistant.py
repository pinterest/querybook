from enum import Enum


# KEEP IT CONSISTENT AS webapp/const/aiAssistant.ts
class AICommandType(Enum):
    SQL_FIX = "SQL_FIX"
    SQL_TITLE = "SQL_TITLE"
    TEXT_TO_SQL = "TEXT_TO_SQL"
    RESET_MEMORY = "RESET_MEMORY"


AI_ASSISTANT_NAMESPACE = "/ai_assistant"
AI_ASSISTANT_REQUEST_EVENT = "ai_assistant_request"
AI_ASSISTANT_RESPONSE_EVENT = "ai_assistant_response"
