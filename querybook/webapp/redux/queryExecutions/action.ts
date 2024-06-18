import { normalize, schema } from 'normalizr';
import type { Socket } from 'socket.io-client';

import { IAccessRequest } from 'const/accessRequest';
import {
    IQueryExecution,
    IQueryExecutionViewer,
    IQueryResultExporter,
    IRawQueryExecution,
    IStatementExecution,
    QueryExecutionStatus,
} from 'const/queryExecution';
import { queryCellExecutionManager } from 'lib/batch/query-execution-manager';
import SocketIOManager from 'lib/socketio-manager';
import { formatError } from 'lib/utils/error';
import { updateDataDocPolling } from 'redux/dataDoc/action';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import {
    QueryExecutionAccessRequestResource,
    QueryExecutionResource,
    QueryExecutionViewerResource,
    StatementResource,
} from 'resource/queryExecution';

import {
    IReceiveQueryExecutionAccessRequestsAction,
    IReceiveQueryExecutionAction,
    IReceiveQueryExecutionsAction,
    IReceiveQueryExecutionViewersAction,
    IReceiveStatementExecutionAction,
    IReceiveStatementExecutionUpdateAction,
    ThunkDispatch,
    ThunkResult,
} from './types';

const statementExecutionSchema = new schema.Entity('statementExecution');
const dataCellSchema = new schema.Entity('dataCell');
const queryExecutionSchema = new schema.Entity('queryExecution', {
    statement_executions: [statementExecutionSchema],
    data_cell: dataCellSchema,
});
export const queryExecutionSchemaList = [queryExecutionSchema];

export function addQueryExecutionAccessRequest(
    executionId: number
): ThunkResult<Promise<IAccessRequest>> {
    return async (dispatch) => {
        const { data } = await QueryExecutionAccessRequestResource.create(
            executionId
        );
        if (data != null) {
            dispatch({
                type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUEST',
                payload: {
                    executionId,
                    request: data,
                },
            });
        }
        return data;
    };
}

export function rejectQueryExecutionAccessRequest(
    executionId: number,
    uid: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const accessRequest = (getState().queryExecutions
            .accessRequestsByExecutionIdUserId[executionId] || {})[uid];
        if (accessRequest) {
            await QueryExecutionAccessRequestResource.delete(executionId, uid);

            dispatch({
                type: '@@queryExecutions/REMOVE_QUERY_EXECUTION_ACCESS_REQUEST',
                payload: {
                    executionId,
                    uid,
                },
            });
        }
    };
}

export function addQueryExecutionViewer(
    executionId: number,
    uid: number
): ThunkResult<Promise<IQueryExecutionViewer>> {
    return async (dispatch, getState) => {
        const request = (getState().queryExecutions
            .accessRequestsByExecutionIdUserId[executionId] || {})[uid];

        const { data } = await QueryExecutionViewerResource.create(
            executionId,
            uid
        );
        if (request) {
            dispatch({
                type: '@@queryExecutions/REMOVE_QUERY_EXECUTION_ACCESS_REQUEST',
                payload: {
                    executionId,
                    uid,
                },
            });
        }
        dispatch({
            type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_VIEWER',
            payload: {
                executionId,
                viewer: data,
            },
        });

        return data;
    };
}

export function deleteQueryExecutionViewer(
    executionId: number,
    uid: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const viewer = (getState().queryExecutions.viewersByExecutionIdUserId[
            executionId
        ] || {})[uid];
        if (viewer) {
            await QueryExecutionViewerResource.delete(viewer.id);

            dispatch({
                type: '@@queryExecutions/REMOVE_QUERY_EXECUTION_VIEWER',
                payload: {
                    executionId,
                    uid,
                },
            });
        }
    };
}

export function receiveQueryExecutionsByCell(
    queryExecutions: IQueryExecution[],
    dataCellId: number
): IReceiveQueryExecutionsAction {
    const normalizedData = normalize(queryExecutions, queryExecutionSchemaList);

    const {
        queryExecution: queryExecutionById = {},
        statementExecution: statementExecutionById = {},
    } = normalizedData.entities;

    return {
        type: '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS',
        payload: {
            queryExecutionById,
            dataCellId,
            statementExecutionById,
        },
    };
}

export function receiveQueryExecution(
    queryExecution: IRawQueryExecution | IQueryExecution,
    dataCellId?: number
): IReceiveQueryExecutionAction {
    const normalizedData = normalize(queryExecution, queryExecutionSchema);
    const {
        queryExecution: queryExecutionById = {},
        statementExecution: statementExecutionById = {},
    } = normalizedData.entities;
    return {
        type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION',
        payload: {
            queryExecutionById,
            statementExecutionById,
            dataCellId,
        },
    };
}

export function receiveQueryExecutionViewers(
    executionId: number,
    viewers: IQueryExecutionViewer[]
): IReceiveQueryExecutionViewersAction {
    return {
        type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_VIEWERS',
        payload: {
            executionId,
            viewers,
        },
    };
}

export function receiveQueryExecutionAccessRequests(
    executionId: number,
    requests: IAccessRequest[]
): IReceiveQueryExecutionAccessRequestsAction {
    return {
        type: '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUESTS',
        payload: {
            executionId,
            requests,
        },
    };
}

function receiveStatementExecution(
    statementExecution
): IReceiveStatementExecutionAction {
    return {
        type: '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION',
        payload: {
            statementExecution,
        },
    };
}

function receiveStatementExecutionUpdate(
    statementExecution: IStatementExecution
): IReceiveStatementExecutionUpdateAction {
    return {
        type: '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION_UPDATE',
        payload: {
            statementExecution,
        },
    };
}

export function fetchQueryExecutionsByCell(
    dataCellId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState();
        if (dataCellId in state.queryExecutions.dataCellIdQueryExecution) {
            return;
        }
        return queryCellExecutionManager.loadExecutionForCell(
            dataCellId,
            dispatch
        );
    };
}

export function fetchDataDocInfoByQueryExecutionIdIfNeeded(
    executionId: number
): ThunkResult<
    Promise<{
        doc_id: number;
        cell_id: number;
        cell_title: string;
    }>
> {
    return async (dispatch, getState) => {
        const state = getState().queryExecutions.queryExecutionIdToCellInfo;
        if (executionId in state) {
            return {
                cell_id: state[executionId].cellId,
                doc_id: state[executionId].docId,
                cell_title: state[executionId].cellTitle,
            };
        }

        const { data: result } = await QueryExecutionResource.getDataDoc(
            executionId
        );

        dispatch({
            type: '@@queryExecutions/RECEIVE_QUERY_CELL_ID_FROM_EXECUTION',
            payload: {
                executionId,
                cellId: result.cell_id,
                cellTitle: result.cell_title,
                docId: result.doc_id,
            },
        });
        return result;
    };
}

export function fetchQueryExecutionIfNeeded(
    queryExecutionId: number
): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const state = getState();
        const queryExecution =
            state.queryExecutions.queryExecutionById[queryExecutionId];

        if (!queryExecution || !queryExecution.statement_executions) {
            return dispatch(fetchQueryExecution(queryExecutionId));
        }
    };
}

function fetchQueryExecution(
    queryExecutionId: number
): ThunkResult<Promise<IQueryExecution>> {
    return async (dispatch) => {
        const { data: execution } = await QueryExecutionResource.get(
            queryExecutionId
        );
        dispatch(receiveQueryExecution(execution));
        return execution;
    };
}

export function fetchQueryExecutionAccessRequests(
    queryExecutionId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: queryExecutionAccessRequests } =
            await QueryExecutionAccessRequestResource.get(queryExecutionId);
        dispatch(
            receiveQueryExecutionAccessRequests(
                queryExecutionId,
                queryExecutionAccessRequests
            )
        );
    };
}

export function fetchQueryExecutionViewers(
    queryExecutionId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: queryExecutionViewers } =
            await QueryExecutionViewerResource.get(queryExecutionId);
        dispatch(
            receiveQueryExecutionViewers(
                queryExecutionId,
                queryExecutionViewers
            )
        );
    };
}

export function fetchActiveQueryExecutionForUser(
    uid: number
): ThunkResult<Promise<IQueryExecution[]>> {
    return async (dispatch, getState) => {
        const { data: queryExecutions } = await QueryExecutionResource.search(
            uid,
            getState().environment.currentEnvironmentId
        );

        const normalizedData = normalize(
            queryExecutions,
            queryExecutionSchemaList
        );
        const {
            queryExecution: queryExecutionById = {},
            statementExecution: statementExecutionById = {},
        } = normalizedData.entities;

        dispatch({
            type: '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS',
            payload: {
                queryExecutionById,
                statementExecutionById,
            },
        });

        return queryExecutions;
    };
}

export function pollQueryExecution(
    queryExecutionId: number,
    docId?: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await queryExecutionSocket.addQueryExecution(
            queryExecutionId,
            docId,
            dispatch
        );
    };
}

export function createQueryExecution(
    query: string,
    engineId?: number,
    cellId?: number,
    metadata?: Record<string, string | number>
): ThunkResult<Promise<IQueryExecution>> {
    return async (dispatch, getState) => {
        const state = getState();
        const selectedEngineId = engineId ?? queryEngineSelector(state)[0].id;

        const { data: queryExecution } = await QueryExecutionResource.create(
            query,
            selectedEngineId,
            cellId,
            metadata
        );
        dispatch(receiveQueryExecution(queryExecution, cellId));

        return queryExecution;
    };
}

export function fetchExporters(): ThunkResult<Promise<IQueryResultExporter[]>> {
    return async (dispatch) => {
        const { data: exporters } = await StatementResource.getExporters();
        dispatch({
            type: '@@queryExecutions/RECEIVE_QUERY_RESULT_EXPORTERS',
            payload: {
                exporters,
            },
        });

        return exporters;
    };
}

export function fetchResult(
    statementExecutionId: number,
    numberOfLines: number
): ThunkResult<Promise<string[][]>> {
    return async (dispatch, getState) => {
        const state = getState();
        const statementExecution =
            state.queryExecutions.statementExecutionById[statementExecutionId];

        if (!statementExecution) {
            return;
        }

        if (statementExecution.result_row_count === 0) {
            return [];
        }

        /**
         * Check to see if there is any data loaded or to be loaded
         *
         * Note: Do not make this async, otherwise multiple fetchResults
         * call may interfere with each other
         */
        const getExistingData = () => {
            // Check loaded result
            const statementResult =
                state.queryExecutions.statementResultById[statementExecutionId];

            if (statementResult && statementResult.limit >= numberOfLines) {
                return statementResult.data;
            }

            // Check if there is anything loading
            const statementResultLoading =
                state.queryExecutions.statementResultLoadingById[
                    statementExecutionId
                ];
            if (statementResultLoading) {
                const request = statementResultLoading.request;
                if (statementResultLoading.numberOfLines >= numberOfLines) {
                    return new Promise<string[][]>((resolve) =>
                        request.then((resp) => resolve(resp.data))
                    );
                } else {
                    request.cancel();
                }
            }
            return null;
        };

        const existingData = getExistingData();
        if (existingData) {
            return existingData;
        }

        try {
            const statementResultRequest = StatementResource.getResult(
                statementExecutionId,
                // Do not let the server read more than necessary
                Math.min(numberOfLines, statementExecution.result_row_count)
            );
            dispatch({
                type: '@@queryExecutions/START_RESULT',
                payload: {
                    statementExecutionId,
                    request: statementResultRequest,
                    numberOfLines,
                },
            });

            const { data } = await statementResultRequest;
            dispatch({
                type: '@@queryExecutions/RECEIVE_RESULT',
                payload: {
                    statementExecutionId,
                    data,
                    limit: numberOfLines,
                },
            });
            return data;
        } catch (error) {
            dispatch({
                type: '@@queryExecutions/RECEIVE_RESULT',
                payload: {
                    statementExecutionId,
                    failed: true,
                    error: formatError(error),
                    limit: numberOfLines,
                },
            });
        }
    };
}

export function fetchLog(
    statementExecutionId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState();
        const statementExecution =
            state.queryExecutions.statementExecutionById[statementExecutionId];
        if (statementExecution) {
            const { id, has_log: hasLog } = statementExecution;
            const statementLog =
                state.queryExecutions.statementLogById[statementExecutionId];
            if (hasLog && (!statementLog || statementLog.isPartialLog)) {
                try {
                    const { data } = await StatementResource.getLogs(id);
                    dispatch({
                        type: '@@queryExecutions/RECEIVE_LOG',
                        payload: {
                            statementExecutionId,
                            data,
                        },
                    });
                } catch (error) {
                    dispatch({
                        type: '@@queryExecutions/RECEIVE_LOG',
                        payload: {
                            statementExecutionId,
                            failed: true,
                            error: JSON.stringify(error, null, 2),
                        },
                    });
                }
            }
        }
    };
}

export function fetchQueryError(
    queryExecutionId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState();
        const queryExecution =
            state.queryExecutions.queryExecutionById[queryExecutionId];
        if (queryExecution) {
            const { id, status } = queryExecution;
            const queryError =
                state.queryExecutions.queryErrorById[queryExecutionId];
            if (status === QueryExecutionStatus.ERROR && !queryError) {
                try {
                    const { data } = await QueryExecutionResource.getError(id);
                    dispatch({
                        type: '@@queryExecutions/RECEIVE_QUERY_ERROR',
                        payload: {
                            queryExecutionId,
                            queryError: data,
                        },
                    });
                } catch (error) {
                    dispatch({
                        type: '@@queryExecutions/RECEIVE_QUERY_ERROR',
                        payload: {
                            queryExecutionId,
                            failed: true,
                            error: JSON.stringify(error, null, 2),
                        },
                    });
                }
            }
        }
    };
}

class QueryExecutionSocket {
    private static NAME_SPACE = '/query_execution';

    // queryExecutionId => docId
    private activeQueryExecutions: Record<number, number> = {};
    private socket: Socket = null;
    private socketPromise: Promise<Socket> = null;
    private dispatch: ThunkDispatch = null;

    public addQueryExecution = async (
        queryExecutionId: number,
        docId: number,
        dispatch: ThunkDispatch
    ) => {
        this.dispatch = dispatch;

        if (!(queryExecutionId in this.activeQueryExecutions)) {
            if (docId != null) {
                this.dispatch(
                    updateDataDocPolling(docId, queryExecutionId, true)
                );
            }

            await this.setupSocket();
            this.activeQueryExecutions[queryExecutionId] = docId;
            this.socket.emit('subscribe', queryExecutionId);
        }
    };

    public onSocketConnect(socket: Socket) {
        // Setup rooms for existing connections
        const activeQueryExecutionIds = Object.keys(this.activeQueryExecutions);
        if (activeQueryExecutionIds.length > 0) {
            activeQueryExecutionIds.map((queryExecutionId) => {
                socket.emit('subscribe', Number(queryExecutionId));
            });
        }
    }

    public removeAllQueryExecution = () => {
        for (const queryExecutionId of Object.values(
            this.activeQueryExecutions
        )) {
            this.removeQueryExecution(queryExecutionId);
        }
    };

    public removeQueryExecution = (queryExecutionId: number) => {
        if (queryExecutionId in this.activeQueryExecutions) {
            // Otherwise its NOOP
            const docId = this.activeQueryExecutions[queryExecutionId];
            delete this.activeQueryExecutions[queryExecutionId];
            if (docId != null) {
                // Update the data doc that is pulling
                this.dispatch(
                    updateDataDocPolling(docId, queryExecutionId, false)
                );
            }

            // Leave the socket room
            this.socket.emit('unsubscribe', queryExecutionId);

            // If we are not running any query any more, break off the socketio connection
            if (Object.keys(this.activeQueryExecutions).length === 0) {
                SocketIOManager.removeSocket(QueryExecutionSocket.NAME_SPACE);
                this.socket = null;
                this.socketPromise = null;
            }
        }
    };

    private processQueryExecution = (queryExecution: IQueryExecution) => {
        this.dispatch(receiveQueryExecution(queryExecution));
        if (queryExecution.status >= 3) {
            this.removeQueryExecution(queryExecution.id);
        }
    };

    private setupSocket = async () => {
        if (this.socketPromise) {
            await this.socketPromise;
        } else {
            // We need to setup our socket
            this.socketPromise = SocketIOManager.getSocket(
                QueryExecutionSocket.NAME_SPACE,
                this.onSocketConnect.bind(this)
            );

            // Setup socket's connection functions
            this.socket = await this.socketPromise;
            this.socket.on('query', (queryExecution: IQueryExecution) => {
                this.processQueryExecution(queryExecution);
            });
            this.socket.on('query_start', (queryExecution: IQueryExecution) => {
                this.processQueryExecution(queryExecution);
            });
            this.socket.on('query_end', (queryExecution: IQueryExecution) => {
                this.processQueryExecution(queryExecution);
            });
            this.socket.on(
                'statement_start',
                (statementExecution: IStatementExecution) => {
                    this.dispatch(
                        receiveStatementExecution(statementExecution)
                    );
                }
            );
            this.socket.on(
                'statement_update',
                (statementExecution: IStatementExecution) => {
                    this.dispatch(
                        receiveStatementExecutionUpdate(statementExecution)
                    );
                }
            );
            this.socket.on(
                'statement_end',
                (statementExecution: IStatementExecution) => {
                    this.dispatch(
                        receiveStatementExecution(statementExecution)
                    );
                }
            );
            this.socket.on(
                'query_cancel',
                (queryExecution: IQueryExecution) => {
                    this.processQueryExecution(queryExecution);
                }
            );
            this.socket.on(
                'query_exception',
                (queryExecution: IQueryExecution) => {
                    this.processQueryExecution(queryExecution);
                }
            );
            return this.socket;
        }
    };
}

export const queryExecutionSocket = new QueryExecutionSocket();
