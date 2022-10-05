import { Nullable } from 'lib/typescript';

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
        validator?: string;
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

export interface IQueryValidator {
    name: string;
    languages: string[];
}

export interface IQueryTranspiler {
    name: string;
    from_languages: string[];
    to_languages: string[];
}

export interface ITranspiledQuery {
    transpiled_query: string;
    original_query?: Nullable<string>;
}
