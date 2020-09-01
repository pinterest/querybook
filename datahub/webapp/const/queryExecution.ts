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

export interface IQueryExecutionViewer {
    id: number;
    uid: number;
    execution_id: number;
}
