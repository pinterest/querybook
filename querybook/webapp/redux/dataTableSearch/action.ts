import ds from 'lib/datasource';
import {
    ThunkResult,
    IDataTableSearchResultResetAction,
    IDataTableSearchResultClearAction,
    ITableSearchResult,
    IDataTableSearchState,
    ITableSearchFilters,
} from './types';

const BATCH_LOAD_SIZE = 100;

function mapStateToSearch(state: IDataTableSearchState) {
    let searchString = state.searchString;

    const filters = Object.entries(state.searchFilters).filter(
        ([_, filterValue]) => filterValue != null
    );

    const matchSchemaName = searchString.match(/(\w+)\.(\w*)/);
    if (matchSchemaName) {
        filters.push(['schema', matchSchemaName[1]]);
        searchString = searchString.replace(/(\w+)\.(\w*)/, '$2');
    }

    const searchParam = {
        metastore_id: state.metastoreId,
        keywords: searchString,
        filters,
        limit: BATCH_LOAD_SIZE,
        concise: true,
        fields: Object.keys(state.searchFields),
    };
    return searchParam;
}

function resetSearchResult(): IDataTableSearchResultResetAction {
    return {
        type: '@@dataTableSearch/DATA_TABLE_SEARCH_RESULT_RESET',
    };
}

export function resetSearch(): IDataTableSearchResultClearAction {
    return {
        type: '@@dataTableSearch/DATA_TABLE_SEARCH_RESET',
    };
}

function searchDataTable(): ThunkResult<Promise<ITableSearchResult[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState().dataTableSearch;
            if (state.searchRequest) {
                state.searchRequest.cancel();
            }
            const searchRequest = ds.fetch<{
                results: ITableSearchResult[];
                count: number;
            }>('/search/tables/', mapStateToSearch(state));
            dispatch(resetSearchResult());
            dispatch({
                type: '@@dataTableSearch/DATA_TABLE_SEARCH_STARTED',
                payload: {
                    searchRequest,
                },
            });

            const {
                data: { results: tables, count },
            } = await searchRequest;

            dispatch({
                type: '@@dataTableSearch/DATA_TABLE_SEARCH_DONE',
                payload: {
                    results: tables,
                    count,
                },
            });

            return tables;
        } catch (error) {
            if (error instanceof Object && error.name === 'AbortError') {
                // guess it got canceled
            } else {
                dispatch({
                    type: '@@dataTableSearch/DATA_TABLE_SEARCH_FAILED',
                    payload: {
                        error,
                    },
                });
            }
        }

        return [];
    };
}

export function getMoreDataTable(): ThunkResult<Promise<ITableSearchResult[]>> {
    return async (dispatch, getState) => {
        const state = getState().dataTableSearch;
        const count = state.count;
        const resultsCount = state.results.length;
        if (resultsCount >= count) {
            return;
        }

        try {
            if (state.searchRequest) {
                state.searchRequest.cancel();
            }
            const searchParams = {
                ...mapStateToSearch(state),
                offset: resultsCount,
            };

            const searchRequest = ds.fetch<{
                results: ITableSearchResult[];
                count: number;
            }>('/search/tables/', searchParams);

            dispatch({
                type: '@@dataTableSearch/DATA_TABLE_SEARCH_STARTED',
                payload: {
                    searchRequest,
                },
            });

            const {
                data: { results: tables },
            } = await searchRequest;

            dispatch({
                type: '@@dataTableSearch/DATA_TABLE_SEARCH_MORE',
                payload: {
                    results: tables,
                },
            });

            return tables;
        } catch (error) {
            if (error instanceof Object && error.name === 'AbortError') {
                // guess it got canceled
            } else {
                dispatch({
                    type: '@@dataTableSearch/DATA_TABLE_SEARCH_FAILED',
                    payload: {
                        error,
                    },
                });
            }
        }

        return [];
    };
}

export function updateSearchString(searchString: string): ThunkResult<void> {
    return (dispatch) => {
        dispatch({
            type: '@@dataTableSearch/DATA_TABLE_SEARCH_STRING_UPDATE',
            payload: {
                searchString,
            },
        });
        dispatch(searchDataTable());
    };
}

export function updateSearchFilter<K extends keyof ITableSearchFilters>(
    filterKey: K,
    filterValue: ITableSearchFilters[K] | null
): ThunkResult<void> {
    return (dispatch) => {
        dispatch({
            type: '@@dataTableSearch/DATA_TABLE_SEARCH_FILTER_UPDATE',
            payload: {
                filterKey,
                filterValue,
            },
        });
        dispatch(searchDataTable());
    };
}

export function resetSearchFilter(): ThunkResult<void> {
    return (dispatch) => {
        dispatch({
            type: '@@dataTableSearch/DATA_TABLE_FILTER_RESET',
        });
        dispatch(searchDataTable());
    };
}

export function selectMetastore(
    metastoreId: number
): ThunkResult<Promise<any>> {
    return (dispatch) => {
        dispatch({
            type: '@@dataTableSearch/DATA_TABLE_SEARCH_SELECT_METASTORE',
            payload: {
                metastoreId,
            },
        });
        return dispatch(searchDataTable());
    };
}
