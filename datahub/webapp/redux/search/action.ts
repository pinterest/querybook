import { getQueryString, replaceQueryString } from 'lib/utils/query-string';
import ds from 'lib/datasource';
import {
    ISearchResultResetAction,
    ISearchAddAuthorAction,
    ThunkResult,
    RESULT_PER_PAGE,
    SearchOrder,
    SearchType,
    ISearchPreview,
    IResetSearchAction,
} from './types';
import { queryMetastoresSelector } from 'redux/dataSources/selector';

export function mapQueryParamToState(): ThunkResult<void> {
    return (dispatch) => {
        dispatch(resetSearchResult());
        const queryParam = getQueryString();
        if (Object.keys(queryParam).length) {
            // Only map search to state when there is query params
            dispatch({
                type: '@@search/SEARCH_RECEIVE_QUERY_PARAM',
                payload: {
                    queryParam,
                },
            });
        }
        dispatch(performSearch());
    };
}

export function mapStateToQueryParam({
    searchFilters,
    searchOrder,
    searchType,
    searchString,
    currentPage,
    searchFields,
}) {
    replaceQueryString({
        searchFilters,
        searchOrder,
        searchType,
        searchString,
        currentPage,
        searchFields,
    });
}

function mapStateToSearch({
    searchFilters,
    searchString,
    currentPage,
    searchOrder,
}: {
    searchFilters: Record<string, any>;
    currentPage: number;
    searchString: string;
    searchOrder: SearchOrder;
}) {
    const filters = Object.entries(searchFilters);
    const searchParam = {
        keywords: searchString,
        filters, // [[creator , x]]
        limit: RESULT_PER_PAGE,
        offset: currentPage * RESULT_PER_PAGE,
    };

    if (searchOrder === SearchOrder.Recency) {
        searchParam['sort_key'] = 'created_at';
        searchParam['sort_order'] = 'desc';
    }

    return searchParam;
}

function resetSearchResult(): ISearchResultResetAction {
    return {
        type: '@@search/SEARCH_RESULT_RESET',
    };
}

export function resetSearch(): IResetSearchAction {
    return {
        type: '@@search/SEARCH_RESET',
    };
}

export function performSearch(): ThunkResult<Promise<ISearchPreview[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const searchState = state.search;
            if (searchState.searchRequest) {
                searchState.searchRequest.cancel();
            }

            const { currentPage, searchType } = searchState;

            let searchEndPoint = null;
            const searchParams = mapStateToSearch(searchState);

            if (searchType === SearchType.DataDoc) {
                searchEndPoint = '/search/datadoc/';
                searchParams['environment_id'] =
                    state.environment.currentEnvironmentId;
            } else if (searchType === SearchType.Table) {
                searchEndPoint = '/search/tables/';
                const selectedMetastoreId = state.dataTableSearch.metastoreId;
                searchParams['metastore_id'] =
                    selectedMetastoreId || queryMetastoresSelector(state)[0].id;
                searchParams['fields'] = Object.keys(searchState.searchFields);
            }

            const searchRequest = ds.fetch<{
                count: number;
                results: ISearchPreview[];
            }>(searchEndPoint, searchParams);

            dispatch({
                type: '@@search/SEARCH_STARTED',
                payload: {
                    searchRequest,
                },
            });

            const {
                data: { results, count },
            } = await searchRequest;

            dispatch({
                type: '@@search/SEARCH_DONE',
                payload: {
                    result: results || [],
                    page: currentPage,
                    count,
                },
            });

            return results;
        } catch (error) {
            if (error instanceof Object && error.name === 'AbortError') {
                // guess it got canceled
            } else {
                dispatch({
                    type: '@@search/SEARCH_FAILED',
                    payload: {
                        error,
                    },
                });
            }
        }

        return [];
    };
}

export function moveToPage(page: number): ThunkResult<void> {
    return (dispatch, getState) => {
        dispatch({
            type: '@@search/SEARCH_GO_TO_PAGE',
            payload: {
                page,
            },
        });
        const state = getState().search;
        mapStateToQueryParam(state);
        if (!(page in state.resultByPage)) {
            dispatch(performSearch());
        }
    };
}

export function updateSearchString(searchString: string): ThunkResult<void> {
    return (dispatch, getState) => {
        dispatch(resetSearchResult());
        dispatch({
            type: '@@search/SEARCH_STRING_UPDATE',
            payload: {
                searchString,
            },
        });
        mapStateToQueryParam(getState().search);
        dispatch(performSearch());
    };
}

export function updateSearchFilter(
    filterKey: string,
    filterValue: any
): ThunkResult<void> {
    return (dispatch, getState) => {
        dispatch(resetSearchResult());
        dispatch({
            type: '@@search/SEARCH_FILTER_UPDATE',
            payload: {
                filterKey,
                filterValue,
            },
        });
        mapStateToQueryParam(getState().search);
        dispatch(performSearch());
    };
}

export function updateSearchField(field: string): ThunkResult<void> {
    return (dispatch, getState) => {
        dispatch(resetSearchResult());
        dispatch({
            type: '@@search/SEARCH_FIELD_UPDATE',
            payload: {
                field,
            },
        });
        mapStateToQueryParam(getState().search);
        dispatch(performSearch());
    };
}

export function updateSearchOrder(orderKey: SearchOrder): ThunkResult<void> {
    return (dispatch, getState) => {
        dispatch(resetSearchResult());
        dispatch({
            type: '@@search/SEARCH_ORDER_UPDATE',
            payload: {
                orderKey,
            },
        });
        mapStateToQueryParam(getState().search);
        dispatch(performSearch());
    };
}

export function updateSearchType(searchType: SearchType): ThunkResult<void> {
    return (dispatch, getState) => {
        updateSearchString('');
        dispatch(resetSearchResult());
        dispatch({
            type: '@@search/SEARCH_TYPE_UPDATE',
            payload: {
                searchType,
            },
        });
        mapStateToQueryParam(getState().search);
        dispatch(performSearch());
    };
}

export function addSearchAuthorChoice(
    id: number,
    name: string
): ISearchAddAuthorAction {
    return {
        type: '@@search/SEARCH_ADD_AUTHOR',
        payload: {
            id,
            name,
        },
    };
}
