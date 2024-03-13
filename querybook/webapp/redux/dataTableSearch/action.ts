import {
    IDataSchema,
    SchemaSortKey,
    SchemaTableSortKey,
} from 'const/metastore';
import { Nullable } from 'lib/typescript';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { SearchSchemaResource, SearchTableResource } from 'resource/search';

import { defaultSortSchemaBy, defaultSortSchemaTableBy } from './const';
import {
    IDataTableSearchResultClearAction,
    IDataTableSearchResultResetAction,
    IDataTableSearchState,
    ISchemasSortChangedAction,
    ISchemaTableSortChangedAction,
    ITableSearchFilters,
    ITableSearchResult,
    ThunkResult,
} from './types';

const BATCH_LOAD_SIZE = 100;

function mapStateToSearch(state: IDataTableSearchState) {
    const searchString = state.searchString;

    const filters = Object.entries(state.searchFilters).filter(
        ([_, filterValue]) => filterValue != null
    );

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
    sortKey?: SchemaTableSortKey | undefined | null,
    sortAsc?: boolean | undefined | null
): ISchemaTableSortChangedAction {
    return {
        type: '@@dataTableSearch/SEARCH_TABLE_BY_SORT_CHANGED',
        payload: {
            id,
            sortKey,
            sortAsc,
        },
    };
}

export function changeSchemasSort(
    sortKey?: SchemaSortKey | undefined | null,
    sortAsc?: boolean | undefined | null
): ISchemasSortChangedAction {
    return {
        type: '@@dataTableSearch/SCHEMAS_SORT_CHANGED',
        payload: {
            sortKey,
            sortAsc,
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
            const tableSort = state.sortTablesBy;
            const search = { ...mapStateToSearch(state) };
            if (tableSort.key === 'name') {
                const tableSortAsc = tableSort.asc ? 'asc' : 'desc';
                search['sort_key'] = ['schema', 'name'];
                search['sort_order'] = [tableSortAsc, tableSortAsc];
            } else if (tableSort.key === 'relevance') {
                search['sort_key'] = '_score';
                search['sort_order'] = 'desc';
            }
            const searchRequest = SearchTableResource.searchConcise(search);
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
            const sortSchemasBy =
                tableSearch.schemas.sortSchemasBy || defaultSortSchemaBy;
            const searchRequest = SearchSchemaResource.getMore({
                metastore_id:
                    tableSearch.metastoreId ||
                    queryMetastoresSelector(getState())[0].id,
                limit: 30,
                offset,
                sort_key: sortSchemasBy.key,
                sort_order: sortSchemasBy.asc ? 'asc' : 'desc',
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
        const state = getState().dataTableSearch;
        const schemaTables = state.schemas.schemaResultById[id];
        const resultsCount = schemaTables.tables?.length ?? 0;

        if (resultsCount >= schemaTables.count) {
            return;
        }

        try {
            const orderBy =
                state.schemas.schemaSortByIds[id] || defaultSortSchemaTableBy;
            const sortOrder = orderBy.asc ? 'asc' : 'desc';
            const searchRequest = SearchTableResource.searchConcise({
                ...mapStateToSearch({
                    ...state,
                    searchFilters: {
                        ...state.searchFilters,
                        schema: schemaName,
                    },
                }),
                sort_key: orderBy.key === 'relevance' ? '_score' : orderBy.key,
                sort_order: orderBy.key === 'relevance' ? 'desc' : sortOrder,
                offset: resultsCount,
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
        const tableSort = state.sortTablesBy;
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

            if (tableSort.key === 'name') {
                const tableSortAsc = tableSort.asc ? 'asc' : 'desc';
                searchParams['sort_key'] = ['schema', 'name'];
                searchParams['sort_order'] = [tableSortAsc, tableSortAsc];
            } else if (tableSort.key === 'relevance') {
                searchParams['sort_key'] = '_score';
                searchParams['sort_order'] = 'desc';
            }

            const searchRequest =
                SearchTableResource.searchConcise(searchParams);

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

export function updateTableSort(
    sortKey?: Nullable<SchemaTableSortKey>,
    sortAsc?: boolean | undefined | null
): ThunkResult<void> {
    return (dispatch) => {
        dispatch({
            type: '@@dataTableSearch/DATA_TABLE_SEARCH_SORT_UPDATE',
            payload: {
                sortTablesBy: {
                    sortKey,
                    sortAsc,
                },
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
