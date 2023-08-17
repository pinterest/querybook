// Keep it in sync with AICommandType in server/const/ai_assistant.py
export enum AICommandType {
    SQL_FIX = 'SQL_FIX',
    SQL_TITLE = 'SQL_TITLE',
    TEXT_TO_SQL = 'TEXT_TO_SQL',
}

export const AI_ASSISTANT_NAMESPACE = '/ai_assistant';
export const AI_ASSISTANT_REQUEST_EVENT = 'ai_assistant_request';
export const AI_ASSISTANT_RESPONSE_EVENT = 'ai_assistant_response';
