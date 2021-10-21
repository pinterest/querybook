import { produce } from 'immer';
import {
    IDataTableSearchState,
    IDataTableSearchPaginationState,
    DataTableSearchAction,
} from './types';

const initialResultState: IDataTableSearchPaginationState = {
    results: [],
    count: 0,
    schemas: {
        schemaIds: [],
        schemaResultById: {},
        schemaSortByIds: {},
        sortSchemasBy: 'name',
        done: false,
    },
};

const initialState: IDataTableSearchState = {
    searchFilters: {},
    searchFields: { table_name: true },
    searchString: '',
    searchRequest: null,
    metastoreId: null,
    ...initialResultState,
};

function getInitialState() {
    if (window.DATA_TABLE_SEARCH_CONFIG?.getInitialState) {
        return window.DATA_TABLE_SEARCH_CONFIG.getInitialState(initialState);
    }

    return initialState;
}

export default function dataTableSearch(
    state = getInitialState(),
    action: DataTableSearchAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataTableSearch/DATA_TABLE_SEARCH_RESULT_RESET': {
                return {
                    ...state,
                    ...initialResultState,
                };
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_RESET': {
                return {
                    ...getInitialState(),
                };
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_STARTED': {
                draft.searchRequest = action.payload.searchRequest;
                return;
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_DONE': {
                const { results, count } = action.payload;

                draft.searchRequest = null;
                draft.results = results;
                draft.count = count;

                return;
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_MORE': {
                const { results } = action.payload;
                draft.searchRequest = null;
                draft.results = draft.results.concat(results);
                return;
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_STRING_UPDATE': {
                draft.searchString = action.payload.searchString;
                return;
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_FILTER_UPDATE': {
                const { filterKey, filterValue } = action.payload;
                if (filterValue != null) {
                    draft.searchFilters[filterKey] = filterValue;
                } else {
                    delete draft.searchFilters[filterKey];
                }

                return;
            }
            case '@@dataTableSearch/DATA_TABLE_FILTER_RESET': {
                draft.searchFilters = {};
                return;
            }
            case '@@dataTableSearch/DATA_TABLE_SEARCH_SELECT_METASTORE': {
                draft.metastoreId = action.payload.metastoreId;
                return;
            }
            case '@@dataTableSearch/SCHEMA_SEARCH_DONE': {
                for (const schema of action.payload.results) {
                    draft.schemas.schemaIds.push(schema.id);
                    draft.schemas.schemaResultById[schema.id] = schema;
                }

                draft.schemas.done = action.payload.done;
                return;
            }

            case '@@dataTableSearch/SEARCH_TABLE_BY_SCHEMA_DONE': {
                const schemaId = action.payload.id;

                const tables =
                    state.schemas.schemaResultById[schemaId]?.tables || [];

                draft.schemas.schemaResultById[schemaId].tables = [
                    ...tables,
                    ...action.payload.results,
                ];
                draft.schemas.schemaResultById[schemaId].count =
                    action.payload.count;
                return;
            }

            case '@@dataTableSearch/SEARCH_TABLE_BY_SORT_CHANGED': {
                draft.schemas.schemaSortByIds[action.payload.id] =
                    action.payload.sort_key;
                /* We have to set .count = 1 because InfinityScroll should make at least
                 one request after sorting for getting the real count. */
                draft.schemas.schemaResultById[action.payload.id].count = 1;
                draft.schemas.schemaResultById[action.payload.id].tables = [];
                return;
            }

            case '@@dataTableSearch/SCHEMAS_SORT_CHANGED': {
                draft.schemas.sortSchemasBy = action.payload.sort_key;
                draft.schemas.schemaIds = [];
                draft.schemas.schemaResultById = {};
                draft.schemas.schemaSortByIds = {};
                draft.schemas.done = false;
                return;
            }
        }
    });
}
