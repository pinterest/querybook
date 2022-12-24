// Keep it in sync with EventType in server/const/event_log.py
export enum EventType {
    // API and WEBSOCKET are only used on server
    API = 'API',
    WEBSOCKET = 'WEBSOCKET',

    VIEW = 'VIEW',
    CLICK = 'CLICK',
}

export enum ComponentType {
    LEFT_SIDEBAR = 'LEFT_SIDEBAR',
    SEARCH_MODAL = 'SEARCH_MODAL',
    CHANGE_LOG = 'CHANGE_LOG',
}

export enum ElementType {
    // Side bar
    HOME_BUTTON = 'HOME_BUTTON',
    SEARCH_BUTTON = 'SEARCH_BUTTON',
    ADHOC_BUTTON = 'ADHOC_BUTTON',
    SCHEDS_BUTTON = 'SCHEDS_BUTTON',
    DOCS_BUTTON = 'DOCS_BUTTON',
    TABLES_BUTTON = 'TABLES_BUTTON',
    SNIPS_BUTTON = 'SNIPS_BUTTON',
    EXECS_BUTTON = 'EXECS_BUTTON',
    STATUS_BUTTON = 'STATUS_BUTTON',
    SETTINGS_BUTTON = 'SETTINGS_BUTTON',
    HELP_BUTTON = 'HELP_BUTTON',

    // Search modal
    TABLE_RESULT_ITEM = 'TABLE_RESULT_ITEM',

    // Data doc
    RUN_QUERY_BUTTON = 'RUN_QUERY_BUTTON',
}

export interface EventData {
    path?: string;
    component?: ComponentType;
    element?: ElementType;
    aux?: object;
}
