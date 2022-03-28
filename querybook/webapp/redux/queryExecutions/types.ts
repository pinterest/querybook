import { Action } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import { DataDocAction } from '../dataDoc/types';
import { IStoreState } from '../store/types';
import {
    IQueryError,
    IQueryExecution,
    IQueryExecutionViewer,
    IQueryResultExporter,
    IStatementExecution,
    IStatementLog,
    IStatementResult,
    IStatementResultLoading,
} from 'const/queryExecution';
import { IAccessRequest } from 'const/accessRequest';

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
        /**
         * Number of lines tried to fetch
         */
        limit: number;
    };
}

export interface IStartResultAction extends Action {
    type: '@@queryExecutions/START_RESULT';
    payload: {
        statementExecutionId: number;
    } & IStatementResultLoading;
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
    | IStartResultAction
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
    statementResultLoadingById: Record<number, IStatementResultLoading>;
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
