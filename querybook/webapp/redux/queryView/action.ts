import { normalize } from 'normalizr';

import { getQueryString, replaceQueryString } from 'lib/utils/query-string';
import * as Utils from 'lib/utils';
import { ThunkResult, IQueryViewResetAction, IQueryViewState } from './types';
import { queryExecutionSchemaList } from 'redux/queryExecutions/action';
import { IRawQueryExecution, QueryViewResource } from 'resource/queryView';

export const CHUNK_LOAD_SIZE = 50;

export function mapQueryParamToState(): ThunkResult<void> {
    return (dispatch) => {
        dispatch(resetQueryView());
        const queryParam = getQueryString();
        dispatch({
            type: '@@querySnippets/QUERY_VIEW_RECEIVE_QUERY_PARAM',
            payload: {
                queryParam,
            },
        });
        return dispatch(searchQueries());
    };
}

export function mapStateToQueryParam(state: IQueryViewState) {
    const { filters, orderBy } = state;

    const queryParam = Utils.removeEmpty({
        ...filters,
        orderBy,
    });
    replaceQueryString(queryParam);
}

function resetQueryView(): IQueryViewResetAction {
    return {
        type: '@@querySnippets/QUERY_VIEW_RESET',
    };
}

function mapStateToSearch(state: IQueryViewState) {
    const { filters, orderBy, offset } = state;

    const searchParam = {
        filters,
        orderBy,
        limit: CHUNK_LOAD_SIZE,
        offset,
    };

    return searchParam;
}

export function searchQueries(): ThunkResult<Promise<IRawQueryExecution[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const queryViewState = state.queryView;
            if (queryViewState.searchRequest) {
                queryViewState.searchRequest.cancel();
            }
            if (queryViewState.endOfList) {
                // We are at the end, no need to search more
                return [];
            }

            const { offset } = queryViewState;
            const searchRequest = QueryViewResource.search(
                state.environment.currentEnvironmentId,
                mapStateToSearch(queryViewState)
            );

            dispatch({
                type: '@@querySnippets/QUERY_VIEW_SEARCH_STARTED',
                payload: {
                    searchRequest,
                },
            });

            const { data } = await searchRequest;
            const normalizedData = normalize(data, queryExecutionSchemaList);
            const {
                queryExecution: queryExecutionById = {},
                dataCell: dataDocCellById = {},
                statementExecution: statementExecutionById = {},
            } = normalizedData.entities;

            const queryExecutionIds = normalizedData.result;
            const count = queryExecutionIds.length;

            dispatch({
                type: '@@queryExecutions/RECEIVE_QUERY_EXECUTIONS',
                payload: {
                    queryExecutionById,
                    statementExecutionById,
                },
            });

            dispatch({
                type: '@@dataDoc/RECEIVE_DATA_CELL',
                payload: {
                    dataDocCellById,
                },
            });

            dispatch({
                type: '@@querySnippets/QUERY_VIEW_SEARCH_DONE',
                payload: {
                    queryExecutionIds,
                    endOfList: count < CHUNK_LOAD_SIZE,
                    offset: offset + count,
                },
            });

            return data;
        } catch (error) {
            if (error instanceof Object && error.name === 'AbortError') {
                // guess it got canceled
            } else {
                dispatch({
                    type: '@@querySnippets/QUERY_VIEW_SEARCH_FAILED',
                    payload: {
                        error,
                    },
                });
            }
        }
        return [];
    };
}

export function updateFilter(
    filterKey: string,
    filterVal
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        dispatch(resetQueryView());
        dispatch({
            type: '@@querySnippets/QUERY_VIEW_SEARCH_FILTER_UPDATE',
            payload: {
                filterKey,
                filterVal,
            },
        });
        mapStateToQueryParam(getState().queryView);
        return dispatch(searchQueries());
    };
}

export function updateOrderBy(orderBy: string): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        dispatch(resetQueryView());
        dispatch({
            type: '@@querySnippets/QUERY_VIEW_SEARCH_ORDER_UPDATE',
            payload: {
                orderBy,
            },
        });
        mapStateToQueryParam(getState().queryView);
        return dispatch(searchQueries());
    };
}
