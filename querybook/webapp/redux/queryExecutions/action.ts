import { normalize, schema } from 'normalizr';

import { updateDataDocPolling } from 'redux/dataDoc/action';
import SocketIOManager from 'lib/socketio-manager';

import ds from 'lib/datasource';
import {
    IReceiveQueryExecutionsAction,
    IReceiveQueryExecutionAction,
    IReceiveStatementExecutionAction,
    ThunkResult,
    ThunkDispatch,
    IReceiveStatementExecutionUpdateAction,
    IQueryExecution,
    IStatementExecution,
    IReceiveQueryExecutionAccessRequestsAction,
    IReceiveQueryExecutionViewersAction,
} from './types';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import {
    QueryExecutionStatus,
    IQueryExecutionViewer,
} from 'const/queryExecution';
import { IAccessRequest } from 'const/accessRequest';

import dataDocSocket from 'lib/data-doc/datadoc-socketio';
import { queryCellExecutionManager } from 'lib/batch/query-execution-manager';

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
        const {
            data,
        }: {
            data: IAccessRequest;
        } = await ds.save(
            `/query_execution/${executionId}/access_request/`,
            {}
        );
        if (data != null) {
            dispatch({
                type:
                    '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUEST',
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
            await ds.delete(`/query_execution/${executionId}/access_request/`, {
                uid,
            });

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

        const {
            data,
        }: {
            data: IQueryExecutionViewer;
        } = await ds.save(`/query_execution/${executionId}/viewer/`, {
            uid,
        });
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
            await ds.delete(`/query_execution_viewer/${viewer.id}/`, {});

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
    queryExecution,
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

export function fetchDataDocInfoByQueryExecutionId(
    executionId: number
): ThunkResult<
    Promise<{
        doc_id: number;
        cell_id: number;
        cell_title: string;
    }>
> {
    return async (dispatch) => {
        const { data: result } = await ds.fetch<{
            doc_id: number;
            cell_id: number;
            cell_title: string;
        }>(`/query_execution/${executionId}/datadoc_cell_info/`);

        dispatch({
            type: '@@queryExecutions/RECEIVE_QUERY_CELL_ID_FROM_EXECUTION',
            payload: {
                executionId,
                cellId: result.cell_id,
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
        const { data: execution } = await ds.fetch<IQueryExecution>(
            `/query_execution/${queryExecutionId}/`
        );
        dispatch(receiveQueryExecution(execution));
        return execution;
    };
}

export function fetchQueryExecutionAccessRequests(
    queryExecutionId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: queryExecutionAccessRequests } = await ds.fetch<
            IAccessRequest[]
        >(`/query_execution/${queryExecutionId}/access_request/`);
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
        const { data: queryExecutionViewers } = await ds.fetch<
            IQueryExecutionViewer[]
        >(`/query_execution/${queryExecutionId}/viewer/`);
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
        const { data: queryExecutions } = await ds.fetch(
            '/query_execution/search/',
            {
                filters: {
                    user: uid,
                    running: true,
                },
                environment_id: getState().environment.currentEnvironmentId,
            }
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
    cellId?: number
): ThunkResult<Promise<IQueryExecution>> {
    return async (dispatch, getState) => {
        const state = getState();

        const selectedEngineId = engineId ?? queryEngineSelector(state)[0].id;

        const params = {
            query,
            engine_id: selectedEngineId,
        };

        if (cellId != null) {
            params['data_cell_id'] = cellId;
            params['originator'] = dataDocSocket.getSocketId();
        }

        const { data: queryExecution } = await ds.save(
            '/query_execution/',
            params
        );
        dispatch(receiveQueryExecution(queryExecution, cellId));

        return queryExecution;
    };
}

export function fetchExporters(): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data: exporters } = await ds.fetch(
            '/query_execution_exporter/'
        );

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
    statementExecutionId: number
): ThunkResult<Promise<string[][]>> {
    return async (dispatch, getState) => {
        const state = getState();
        const statementExecution =
            state.queryExecutions.statementExecutionById[statementExecutionId];
        if (statementExecution) {
            const { id, result_row_count: resultRowCount } = statementExecution;
            const statementResult =
                state.queryExecutions.statementResultById[statementExecutionId];
            if (resultRowCount > 0 && !statementResult) {
                try {
                    const { data } = await ds.fetch({
                        url: `/statement_execution/${id}/result/`,
                    });
                    dispatch({
                        type: '@@queryExecutions/RECEIVE_RESULT',
                        payload: {
                            statementExecutionId,
                            data,
                        },
                    });
                    return data;
                } catch (error) {
                    dispatch({
                        type: '@@queryExecutions/RECEIVE_RESULT',
                        payload: {
                            statementExecutionId,
                            failed: true,
                            error: JSON.stringify(error, null, 2),
                        },
                    });
                }
            } else if (statementResult) {
                return statementResult.data;
            }
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
                    const { data } = await ds.fetch(
                        `/statement_execution/${id}/log/`
                    );
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
                    const { data } = await ds.fetch(
                        `/query_execution/${id}/error/`
                    );
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

export function cancelQueryExecution(queryExecutionId: number) {
    return ds.delete(`/query_execution/${queryExecutionId}/`);
}

class QueryExecutionSocket {
    private static NAME_SPACE = '/query_execution';

    // queryExecutionId => docId
    private activeQueryExecutions: Record<number, number> = {};
    private socket: SocketIOClient.Socket = null;
    private socketPromise: Promise<any> = null;
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
            this.activeQueryExecutions[queryExecutionId] = docId;

            await this.setupSocket();

            this.socket.emit('subscribe', queryExecutionId);
        }
    };

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
                SocketIOManager.removeSocket(this.socket);
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
                QueryExecutionSocket.NAME_SPACE
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

            this.socket.on('reconnect', () => {
                // Setup rooms again
                const activeQueryExecutionIds = Object.keys(
                    this.activeQueryExecutions
                );
                if (activeQueryExecutionIds.length > 0) {
                    activeQueryExecutionIds.map((queryExecutionId) => {
                        this.socket.emit('subscribe', Number(queryExecutionId));
                    });
                }
            });
        }
    };
}

export const queryExecutionSocket = new QueryExecutionSocket();
