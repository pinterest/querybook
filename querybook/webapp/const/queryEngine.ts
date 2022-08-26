export interface IQueryEngine {
    id: number;

    name: string;
    language: string;
    description: string;

    metastore_id: number;
    executor: string;

    feature_params: {
        row_limit?: number;
        status_checker?: string;
        upload_exporter?: string;
    };
}

export interface IQueryEngineEnvironment {
    id: number;
    query_engine_id: number;
    environment_id: number;
    engine_order: number;
}

// Keep in sync with const/query_execution.py
export enum QueryEngineStatus {
    UNAVAILABLE = 0, // Information is not available
    GOOD = 1, // Executor is running without problem
    WARN = 2, // Executor is running with warnings
    ERROR = 3, // Executor is down, queries cannot be issued
}

export interface IEngineStatusData {
    status: QueryEngineStatus;
    messages: string[];
    status_info: string;
}
