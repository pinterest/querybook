import { ICancelablePromise } from 'lib/datasource';

// Keep this the same as the Enum defined in const/query_execution.py
export enum QueryExecutionStatus {
    INITIALIZED = 0,
    DELIVERED,
    RUNNING,
    DONE,
    ERROR,
    CANCEL,
}

export enum StatementExecutionStatus {
    INITIALIZED = 0,
    RUNNING,
    UPLOADING,
    DONE,
    ERROR,
    CANCEL,
}

export enum QueryExecutionErrorType {
    INTERNAL = 0,
    ENGINE,
    SYNTAX,
}

export enum QueryExecutionExportStatus {
    RUNNING = 0,
    DONE,
    ERROR,
}

export interface IQueryExecutionViewer {
    id: number;
    uid: number;
    execution_id: number;
}

export interface IQueryExecution {
    id: number;
    created_at: number;
    completed_at?: number;
    status: number;
    task_id: string;

    query: string;
    engine_id: number;
    uid: number;

    statement_executions?: number[];

    // If the query is still running
    // it may have a field called total which
    // indicates the total number of statements
    total?: number;
}

export interface IQueryExecutionExportResult {
    type: 'url' | 'text';
    info: string;
}

export interface IQueryExecutionExportStatusInfo {
    task_id: string;
    status: number;
    message?: string;
    result?: IQueryExecutionExportResult;
}

export type IRawQueryExecution = IQueryExecution & {
    statement_executions: IStatementExecution[];
};

export interface IStatementExecution {
    id: number;

    completed_at: number;
    created_at: number;
    error_msg?: string;
    has_log: boolean;
    result_row_count: number;
    statement_range_end: number;
    statement_range_start: number;
    status: number;
    meta_info: string;

    // These fields exist when the query is running
    percent_complete?: number;

    // These properties may or may not be there during the initial load
    query_execution_id?: number;
    log?: string[];
    downloadUrl?: string;
    downloadUrlFailed?: boolean;
}

export interface IStatementResult {
    data?: string[][];
    error?: any;
    failed?: boolean;
    /**
     * Number of lines tried to fetch
     */
    limit: number;
}

export interface IStatementResultLoading {
    request: ICancelablePromise<{ data: string[][] }>;
    numberOfLines: number;
}

export interface IStatementLog {
    data: string[];
    error?: any;
    failed?: boolean;
    isPartialLog?: boolean;
}

export interface IQueryError {
    error_type: number;
    error_message_extracted: string;
    error_message: string;
}

export interface IQueryResultExporter {
    name: string;
    type: 'url' | 'text';
    requires_auth: boolean;
    form: IStructFormField;
}

export interface IQueryExecutionNotification {
    id: number;
    query_execution_id: number;
    user: number;
}

// Make sure this is in increasing order
export const StatementExecutionResultSizes = [1000, 5000, 10000, 50000];
