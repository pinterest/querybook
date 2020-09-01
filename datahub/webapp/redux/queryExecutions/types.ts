import { Action } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import { DataDocAction } from '../dataDoc/types';
import { IStoreState } from '../store/types';
import { IQueryExecutionViewer } from 'const/queryExecution';
import { IAccessRequest } from 'const/accessRequest';

export interface IQueryExecution {
    id: number;
    created_at: number;
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
    data: string[][];
    error?: any;
    failed?: boolean;
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

export interface IReceiveQueryExecutionsAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS';
    payload: {
        queryExecutionById: Record<number, IQueryExecution>;
        statementExecutionById: Record<number, IStatementExecution>;
        dataCellId?: number;
    };
}

export interface IReceiveQueryExecutionAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION';
    payload: {
        queryExecutionById: Record<number, IQueryExecution>;
        statementExecutionById: Record<number, IStatementExecution>;
        dataCellId?: number;
    };
}

export interface IReceiveQueryErrorAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_ERROR';
    payload: {
        queryExecutionId: number;
        queryError?: IQueryError;
        failed?: boolean;
        error?: any;
    };
}

export interface IReceiveDownloadUrlAction extends Action {
    type: '@@queryExecutions/RECEIVE_DOWNLOAD_URL';
    payload: {
        statementExecutionId: number;
        downloadUrl?: string;
        failed?: boolean;
        error?: any;
    };
}

export interface IReceiveResultAction extends Action {
    type: '@@queryExecutions/RECEIVE_RESULT';
    payload: {
        statementExecutionId: number;
        data?: string[][];
        failed?: boolean;
        error?: any;
    };
}

export interface IReceiveLogAction extends Action {
    type: '@@queryExecutions/RECEIVE_LOG';
    payload: {
        statementExecutionId: number;
        data?: string[];
        failed?: boolean;
        error?: any;
    };
}

export interface IReceiveStatementExecutionAction extends Action {
    type: '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION';
    payload: {
        statementExecution: IStatementExecution;
    };
}

export interface IReceiveStatementExecutionUpdateAction extends Action {
    type: '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION_UPDATE';
    payload: {
        statementExecution: IStatementExecution;
    };
}

export interface IReceiveStatementExporters extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_RESULT_EXPORTERS';
    payload: {
        exporters: IQueryResultExporter[];
    };
}

export interface IReceiveQueryCellIdFromExecution extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_CELL_ID_FROM_EXECUTION';
    payload: {
        executionId: number;
        cellId: number;
    };
}

export interface IRemoveQueryExecutionAccessRequestAction extends Action {
    type: '@@queryExecutions/REMOVE_QUERY_EXECUTION_ACCESS_REQUEST';
    payload: {
        executionId: number;
        uid: number;
    };
}

export interface IReceiveQueryExecutionViewerAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_VIEWER';
    payload: {
        executionId: number;
        viewer: IQueryExecutionViewer;
    };
}

export interface IReceiveQueryExecutionViewersAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_VIEWERS';
    payload: {
        executionId: number;
        viewers: IQueryExecutionViewer[];
    };
}

export interface IRemoveQueryExectionViewerAction extends Action {
    type: '@@queryExecutions/REMOVE_QUERY_EXECUTION_VIEWER';
    payload: {
        executionId: number;
        uid: number;
    };
}

export interface IReceiveQueryExecutionAccessRequestAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUEST';
    payload: {
        executionId: number;
        request: IAccessRequest;
    };
}

export interface IReceiveQueryExecutionAccessRequestsAction extends Action {
    type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUESTS';
    payload: {
        executionId: number;
        requests: IAccessRequest[];
    };
}

export type QueryExecutionAction =
    | IReceiveQueryExecutionsAction
    | IReceiveQueryExecutionAction
    | IReceiveQueryErrorAction
    | IReceiveDownloadUrlAction
    | IReceiveResultAction
    | IReceiveLogAction
    | IReceiveStatementExecutionAction
    | IReceiveStatementExecutionUpdateAction
    | IReceiveStatementExporters
    | IReceiveQueryCellIdFromExecution
    | IReceiveQueryExecutionAccessRequestAction
    | IRemoveQueryExecutionAccessRequestAction
    | IReceiveQueryExecutionViewerAction
    | IReceiveQueryExecutionViewersAction
    | IRemoveQueryExectionViewerAction
    | IReceiveQueryExecutionAccessRequestsAction;

export interface IQueryExecutionState {
    queryExecutionById: Record<number, IQueryExecution>;
    statementExecutionById: Record<number, IStatementExecution>;
    dataCellIdQueryExecution: Record<number, Set<number>>;

    queryErrorById: Record<number, IQueryError>;
    statementResultById: Record<number, IStatementResult>;
    statementLogById: Record<number, IStatementLog>;

    statementExporters: IQueryResultExporter[];

    viewersByExecutionIdUserId: Record<
        number,
        Record<number, IQueryExecutionViewer>
    >;
    accessRequestsByExecutionIdUserId: Record<
        number,
        Record<number, IAccessRequest>
    >;
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    QueryExecutionAction
>;

export type ThunkDispatch = ReduxThunkDispatch<
    IStoreState,
    undefined,
    QueryExecutionAction | DataDocAction
>;
