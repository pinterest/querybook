import { produce } from 'immer';
import moment from 'moment';
import { combineReducers } from 'redux';

import { StatementExecutionStatus } from 'const/queryExecution';
import { linkifyLog, arrayGroupByField } from 'lib/utils';
import { IQueryExecutionState, QueryExecutionAction } from './types';

const initialState: IQueryExecutionState = {
    queryExecutionById: {},
    statementExecutionById: {},
    dataCellIdQueryExecution: {},

    statementResultById: {},
    statementLogById: {},
    queryErrorById: {},
    statementExporters: [],

    viewersByExecutionIdUserId: {},
    accessRequestsByExecutionIdUserId: {},
};

function dataCellIdQueryExecutionReducer(
    state = initialState.dataCellIdQueryExecution,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS': {
                const { queryExecutionById, dataCellId } = action.payload;
                if (dataCellId != null) {
                    draft[dataCellId] = new Set(
                        Object.keys(queryExecutionById).map(Number)
                    );
                }
                return;
            }
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION': {
                const { queryExecutionById, dataCellId } = action.payload;
                if (dataCellId != null) {
                    for (const [id] of Object.entries(queryExecutionById)) {
                        draft[dataCellId] = new Set([
                            ...(state[dataCellId] || []),
                            Number(id),
                        ]);
                    }
                }

                return;
            }
            case '@@queryExecutions/RECEIVE_QUERY_CELL_ID_FROM_EXECUTION': {
                const { executionId, cellId } = action.payload;
                draft[cellId] = new Set([
                    ...(state[cellId] || []),
                    Number(executionId),
                ]);
            }
        }
    });
}

function statementExecutionByIdReducer(
    state = initialState.statementExecutionById,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS':
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION': {
                const { statementExecutionById } = action.payload;
                for (const statementExecution of Object.values(
                    statementExecutionById
                )) {
                    draft[statementExecution.id] = {
                        ...draft[statementExecution.id],
                        ...statementExecution,
                    };
                }
                return;
            }
            case '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION': {
                const { statementExecution } = action.payload;
                draft[statementExecution.id] = statementExecution;
                return;
            }
            case '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION_UPDATE': {
                const { statementExecution } = action.payload;
                draft[statementExecution.id] = {
                    ...draft[statementExecution.id],
                    ...statementExecution,
                };
                return;
            }
            case '@@queryExecutions/RECEIVE_DOWNLOAD_URL': {
                const {
                    statementExecutionId,
                    downloadUrl,
                    failed = false,
                } = action.payload;
                // TODO(querybook): formalized handling of redux error
                // For download url, right now we just silently suppress it
                draft[statementExecutionId] = {
                    ...draft[statementExecutionId],
                    downloadUrl,
                    downloadUrlFailed: failed,
                };
                return;
            }
        }
    });
}

function queryExecutionByIdReducer(
    state = initialState.queryExecutionById,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS': {
                const { queryExecutionById } = action.payload;
                for (const [id, queryExecution] of Object.entries(
                    queryExecutionById
                )) {
                    draft[id] = {
                        ...draft[id],
                        ...queryExecution,
                    };
                }
                return;
            }
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION': {
                const { queryExecutionById } = action.payload;

                return {
                    ...state,
                    ...queryExecutionById,
                };
            }
            case '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION':
            case '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION_UPDATE': {
                const { statementExecution } = action.payload;

                const queryExecutionId = statementExecution.query_execution_id;
                const queryExecution = draft[queryExecutionId];
                const { statement_executions: statementExecutions = [] } =
                    queryExecution || {};

                if (
                    statementExecutions.length > 0 &&
                    statementExecutions[statementExecutions.length - 1] ===
                        statementExecution.id
                ) {
                    return;
                }

                draft[
                    queryExecutionId
                ].statement_executions = statementExecutions.concat([
                    statementExecution.id,
                ]);
                return;
            }
        }
    });
}

function getPartialLogHeader() {
    return [
        `${moment().format('MMM D, h:mma')} Logging starting...`,
        'Previous (If Any) logs will be available when the statement finishes.',
        '------------------------------------------------------',
    ];
}

function statementLogByIdReducer(
    state = initialState.statementLogById,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS':
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION': {
                const { statementExecutionById } = action.payload;
                for (const statementExecution of Object.values(
                    statementExecutionById
                )) {
                    if (statementExecution.log != null) {
                        const linkfiedLogs = statementExecution.log.map((log) =>
                            linkifyLog(log)
                        );
                        if (
                            statementExecution.status ===
                            StatementExecutionStatus.RUNNING
                        ) {
                            draft[statementExecution.id] = {
                                data: getPartialLogHeader()
                                    .concat(linkfiedLogs)
                                    .concat([
                                        '------------------------------------------------------',
                                        'Logs after this point are streamed via websocket',
                                        '------------------------------------------------------',
                                    ]),
                                isPartialLog: true,
                            };
                        } else {
                            draft[statementExecution.id] = {
                                data: linkfiedLogs,
                            };
                        }
                    }
                }
                return;
            }
            case '@@queryExecutions/RECEIVE_STATEMENT_EXECUTION_UPDATE': {
                const {
                    statementExecution: { id, log },
                } = action.payload;
                if (log) {
                    const linkfiedLogs = log.map((l) => linkifyLog(l));
                    const oldStatementLog = draft[id];
                    const oldLogData =
                        (oldStatementLog && oldStatementLog.data) ||
                        getPartialLogHeader();
                    const mergedLog = oldLogData.concat(linkfiedLogs);

                    draft[id] = {
                        data: mergedLog,
                        isPartialLog: true,
                    };
                }

                return;
            }
            case '@@queryExecutions/RECEIVE_LOG': {
                const {
                    statementExecutionId,
                    data,
                    failed = false,
                    error,
                } = action.payload;

                draft[statementExecutionId] = {
                    ...draft[statementExecutionId],
                    data: data.map((log) => linkifyLog(log)),
                    failed,
                    error,
                };
                return;
            }
        }
    });
}

function statementResultByIdReducer(
    state = initialState.statementResultById,
    action: QueryExecutionAction
) {
    switch (action.type) {
        case '@@queryExecutions/RECEIVE_RESULT': {
            const {
                statementExecutionId,
                data,
                failed = false,
                error,
            } = action.payload;

            return {
                ...state,
                [statementExecutionId]: {
                    ...(state[statementExecutionId] || {}),
                    data,
                    failed,
                    error,
                },
            };
        }
    }
    return state;
}

function queryErrorByIdReducer(
    state = initialState.queryErrorById,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_ERROR': {
                const {
                    queryExecutionId,
                    queryError,
                    failed = false,
                    error,
                } = action.payload;

                draft[queryExecutionId] = failed
                    ? {
                          error_type: -1,
                          error_message_extracted: error,
                          error_message: error,
                      }
                    : queryError;
                return;
            }
        }
    });
}

function accessRequestsByExecutionIdUserIdReducer(
    state = initialState.accessRequestsByExecutionIdUserId,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUESTS': {
                const { executionId, requests } = action.payload;
                draft[executionId] = arrayGroupByField(requests, 'uid');
                return;
            }
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION_ACCESS_REQUEST': {
                const { executionId, request } = action.payload;
                if (!(executionId in draft)) {
                    draft[executionId] = {};
                }
                draft[executionId][request.uid] = request;
                return;
            }
            case '@@queryExecutions/REMOVE_QUERY_EXECUTION_ACCESS_REQUEST': {
                const { executionId, uid } = action.payload;
                if (draft?.[executionId]?.[uid]) {
                    delete draft[executionId][uid];
                }
                return;
            }
        }
    });
}

function viewersByExecutionIdUserIdReducer(
    state = initialState.viewersByExecutionIdUserId,
    action: QueryExecutionAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION_VIEWERS': {
                const { executionId, viewers } = action.payload;
                draft[executionId] = arrayGroupByField(viewers, 'uid');
                return;
            }
            case '@@queryExecutions/RECEIVE_QUERY_EXECUTION_VIEWER': {
                const { executionId, viewer } = action.payload;
                if (!(executionId in draft)) {
                    draft[executionId] = {};
                }
                draft[executionId][viewer.uid] = viewer;
                return;
            }
            case '@@queryExecutions/REMOVE_QUERY_EXECUTION_VIEWER': {
                const { executionId, uid } = action.payload;
                if (draft?.[executionId]?.[uid]) {
                    delete draft[executionId][uid];
                }
                return;
            }
        }
    });
}

function statementExportersReducer(
    state = initialState.statementExporters,
    action: QueryExecutionAction
) {
    switch (action.type) {
        case '@@queryExecutions/RECEIVE_QUERY_RESULT_EXPORTERS': {
            return action.payload.exporters;
        }
    }
    return state;
}

export default combineReducers({
    dataCellIdQueryExecution: dataCellIdQueryExecutionReducer,
    statementExecutionById: statementExecutionByIdReducer,
    queryExecutionById: queryExecutionByIdReducer,

    statementResultById: statementResultByIdReducer,
    statementLogById: statementLogByIdReducer,
    queryErrorById: queryErrorByIdReducer,
    statementExporters: statementExportersReducer,
    accessRequestsByExecutionIdUserId: accessRequestsByExecutionIdUserIdReducer,
    viewersByExecutionIdUserId: viewersByExecutionIdUserIdReducer,
});
