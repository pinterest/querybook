// Keep it in sync with AICommandType in server/const/ai_assistant.py
export enum AICommandType {
    SQL_FIX = 'sql_fix',
    SQL_TITLE = 'sql_title',
    TEXT_TO_SQL = 'text_to_sql',
    TABLE_SUMMARY = 'table_summary',
    TABLE_SELECT = 'table_select',
    SQL_COMPLETE = 'sql_complete',
    DATA_DOC_TITLE = 'data_doc_title',
}

export enum AISocketEvent {
    DATA = 'data',
    DELTA_DATA = 'delta_data',
    DELTA_END = 'delta_end',
    TABLES = 'tables',
    CLOSE = 'close',
    ERROR = 'error',
}

export const AI_ASSISTANT_NAMESPACE = '/ai_assistant';
