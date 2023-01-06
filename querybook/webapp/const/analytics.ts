// Keep it in sync with EventType in server/const/event_log.py
export enum EventType {
    // API and WEBSOCKET are only used on server
    API = 'API',
    WEBSOCKET = 'WEBSOCKET',

    VIEW = 'VIEW',
    CLICK = 'CLICK',
}

export enum ComponentType {
    LANDING_PAGE = 'LANDING_PAGE',
    CHANGE_LOG = 'CHANGE_LOG',
    LEFT_SIDEBAR = 'LEFT_SIDEBAR',
    SEARCH_MODAL = 'SEARCH_MODAL',
    DATADOC_PAGE = 'DATADOC_PAGE',
    ADHOC_QUERY_CELL = 'ADHOC_QUERY_CELL',
    DATADOC_QUERY_CELL = 'DATADOC_QUERY_CELL',
    RIGHT_SIDEBAR = 'RIGHT_SIDEBAR',
    TABLE_DETAIL_VIEW = 'TABLE_DETAIL_VIEW',
    TABLE_NAVIGATOR_SEARCH = 'TABLE_NAVIGATOR_SEARCH',
}

export enum ElementType {
    // Landing page
    TUTORIAL_BUTTON = 'TUTORIAL_BUTTON',
    RECENT_DATADOC = 'RECENT_DATADOC',
    FAVORITE_DATADOC = 'FAVORITE_DATADOC',

    // Left sidebar
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

    // Table navigator search
    TABLE_ORDER_BY_BUTTON = 'TABLE_ORDER_BY_BUTTON',
    VIEW_TABLE_BUTTON = 'VIEW_TABLE_BUTTON',

    // Right sidebar
    GO_TO_TOP_BUTTON = 'GO_TO_TOP_BUTTON',
    COLLAPSE_DATADOC_BUTTON = 'COLLAPSE_DOC_BUTTON',
    DATADOC_UI_GUIDE_BUTTON = 'DATADOC_UI_GUIDE_BUTTON',
    RUN_ALL_CELLS_BUTTON = 'RUN_ALL_CELLS_BUTTON',
    DAG_EXPORTER_BUTTON = 'DAG_EXPORTER_BUTTON',
    LISTS_BUTTON = 'VIEW_LISTS_BUTTON',
    SCHEDULE_DATADOC_BUTTON = 'SCHEDULE_BUTTON',
    CLONE_DATADOC_BUTTON = 'CLONE_DATADOC_BUTTON',
    DELETE_DATADOC_BUTTON = 'DELETE_DATADOC_BUTTON',

    // Search modal
    QUERY_SEARCH_TAB = 'QUERY_SEARCH_TAB',
    DATADOC_SEARCH_TAB = 'DATADOC_SEARCH_TAB',
    TABLE_SEARCH_TAB = 'TABLE_SEARCH_TAB',
    LIST_SEARCH_TAB = 'LIST_SEARCH_TAB',
    QUERY_RESULT_ITEM = 'QUERY_RESULT_ITEM',
    DATADOC_RESULT_ITEM = 'DATADOC_RESULT_ITEM',
    TABLE_RESULT_ITEM = 'TABLE_RESULT_ITEM',
    LIST_RESULT_ITEM = 'LIST_RESULT_ITEM',

    // Datadoc page
    SHARE_DATADOC_BUTTON = 'SHARE_DATADOC_BUTTON',
    INSERT_CELL_BUTTON = 'INSERT_CELL_BUTTON',
    SHARE_CELL_BUTTON = 'SHARE_CELL_BUTTON',
    COPY_CELL_BUTTON = 'COPY_CELL_BUTTON',
    CUT_CELL_BUTTON = 'CUT_CELL_BUTTON',
    PASTE_CELL_BUTTON = 'PASTE_CELL_BUTTON',
    COLLAPSE_CELL_BUTTON = 'COLLAPSE_CELL_BUTTON',
    DELETE_CELL_BUTTON = 'DELETE_CELL_BUTTON',
    MOVE_CELL_BUTTON = 'MOVE_CELL_BUTTON',

    // Query Cell
    RUN_QUERY_BUTTON = 'RUN_QUERY_BUTTON',
    FORMAT_BUTTON = 'FORMAT_BUTTON',
    CLEAR_BUTTON = 'CLEAR_BUTTON',
    TEMPLATE_CONFIG_BUTTON = 'TEMPLATE_CONFIG_BUTTON',
    RENDER_QUERY_BUTTON = 'RENDER_QUERY_BUTTON',
    CREATE_DATADOC_BUTTON = 'CREATE_DATADOC_BUTTON',

    // Table detail view
    OVERVIEW_TABLE_TAB = 'OVERVIEW_TABLE_TAB',
    COLUMNS_TABLE_TAB = 'COLUMNS_TABLE_TAB',
    ROW_SAMPLES_TABLE_TAB = 'ROW_SAMPLES_TABLE_TAB',
    LINEAGE_TABLE_TAB = 'LINEAGE_TABLE_TAB',
    SOURCE_QUERY_TABLE_TAB = 'SOURCE_QUERY_TABLE_TAB',
    QUERY_EXAMPLES_TABLE_TAB = 'QUERY_EXAMPLES_TABLE_TAB',
    LISTS_TABLE_TAB = 'LISTS_TABLE_TAB',
    WARNINGS_TABLE_TAB = 'WARNINGS_TABLE_TAB',
}

export interface EventData {
    path?: string;
    component?: ComponentType;
    element?: ElementType;
    aux?: object;
}

export interface AnalyticsEvent {
    type: EventType;
    data: EventData;
    timestamp: number;
}
