import { SearchTableResource, SearchSchemaResource } from 'resource/search';
import {
    ThunkResult,
    IDataTableSearchResultResetAction,
    IDataTableSearchResultClearAction,
    ITableSearchResult,
    IDataTableSearchState,
    ITableSearchFilters,
    ISchemaTableSortChangedAction,
    ISchemasSortChangedAction,
} from './types';

import { queryMetastoresSelector } from 'redux/dataSources/selector';

import { IDataSchema } from 'const/metastore';

const BATCH_LOAD_SIZE = 100;

function mapStateToSearch(state: IDataTableSearchState) {
    const searchString = state.searchString;

    const filters = Object.entries(state.searchFilters).filter(
        ([_, filterValue]) => filterValue != null
    );

    const matchSchemaName = searchString.match(/(\w+)\.(\w*)/);
    if (matchSchemaName) {
        filters.push(['schema', matchSchemaName[1]]);
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

export function changeTableSort(
    id: number,
    isImportance: boolean
): ISchemaTableSortChangedAction {
    return {
        type: '@@dataTableSearch/SEARCH_TABLE_BY_SORT_CHANGED',
        payload: {
            id,
            sort_key: isImportance ? 'importance_score' : 'name',
        },
    };
}

export function changeSchemasSort(
    isSortByName: boolean
): ISchemasSortChangedAction {
    return {
        type: '@@dataTableSearch/SCHEMAS_SORT_CHANGED',
        payload: {
            sort_key: isSortByName ? 'name' : 'table_count',
        },
    };
}

function searchDataTable(): ThunkResult<Promise<ITableSearchResult[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState().dataTableSearch;
            if (state.searchRequest) {
                state.searchRequest.cancel();
            }
            const searchRequest = SearchTableResource.searchConcise(
                mapStateToSearch(state)
            );
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

export function searchSchemas(): ThunkResult<Promise<IDataSchema[]>> {
    return async (dispatch, getState) => {
        try {
            const tableSearch = getState().dataTableSearch;
            const offset = tableSearch.schemas.schemaIds.length;
            const sortKey = tableSearch.schemas.sortSchemasBy || 'name';
            const searchRequest = SearchSchemaResource.getMore({
                metastore_id:
                    tableSearch.metastoreId ||
                    queryMetastoresSelector(getState())[0].id,
                limit: 30,
                offset,
                sort_key: sortKey,
                sort_order: sortKey === 'name' ? 'asc' : 'desc',
            });
            dispatch({
                type: '@@dataTableSearch/SCHEMA_SEARCH_STARTED',
            });

            const { data } = await searchRequest;

            dispatch({
                type: '@@dataTableSearch/SCHEMA_SEARCH_DONE',
                payload: data,
            });

            return data.results;
        } catch (error) {
            console.error(error);
        }

        return [];
    };
}

export function searchTableBySchema(
    schemaName: string,
    id: number
): ThunkResult<Promise<ITableSearchResult[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState().dataTableSearch;
            const searchRequest = SearchTableResource.searchConcise({
                ...mapStateToSearch({
                    ...state,
                    searchFilters: {
                        ...state.searchFilters,
                        schema: schemaName,
                    },
                }),
                sort_key: state.schemas.schemaSortByIds[id] || 'name',
                sort_order: 'desc',
            });
            dispatch({
                type: '@@dataTableSearch/SEARCH_TABLE_BY_SCHEMA_STARTED',
            });

            const { data } = await searchRequest;

            dispatch({
                type: '@@dataTableSearch/SEARCH_TABLE_BY_SCHEMA_DONE',
                payload: {
                    results: data.results,
                    count: data.count,
                    id,
                },
            });

            return data.results;
        } catch (error) {
            console.error(error);
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

            const searchRequest = SearchTableResource.searchConcise(
                searchParams
            );

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
