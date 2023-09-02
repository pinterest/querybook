from enum import Enum


# KEEP IT CONSISTENT AS webapp/const/aiAssistant.ts
class AICommandType(Enum):
    SQL_FIX = "sql_fix"
    SQL_TITLE = "sql_title"
    TEXT_TO_SQL = "text_to_sql"


AI_ASSISTANT_NAMESPACE = "/ai_assistant"