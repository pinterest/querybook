// Keep it in sync with AICommandType in server/const/ai_assistant.py
export enum AICommandType {
    SQL_FIX = 'sql_fix',
    SQL_TITLE = 'sql_title',
    TEXT_TO_SQL = 'text_to_sql',
}

export const AI_ASSISTANT_NAMESPACE = '/ai_assistant';
