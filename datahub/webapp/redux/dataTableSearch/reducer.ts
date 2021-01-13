import { produce } from 'immer';
import {
    IDataTableSearchState,
    IDataTableSearchPaginationState,
    DataTableSearchAction,
} from './types';

const initialResultState: IDataTableSearchPaginationState = {
    results: [],
    count: 0,
};

const initialState: IDataTableSearchState = {
    searchFilters: {},
    searchFields: { table_name: true },
    searchString: '',
    searchRequest: null,
    metastoreId: null,
    ...initialResultState,
};

export default function dataTableSearch(
    state = initialState,
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
                    ...initialState,
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
        }
    });
}
