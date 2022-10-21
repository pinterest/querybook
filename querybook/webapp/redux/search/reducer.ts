import { produce } from 'immer';

import { UserAction } from 'redux/user/types';

import {
    ISearchPaginationState,
    ISearchState,
    SearchAction,
    SearchOrder,
    SearchType,
} from './types';

const initialPaginationState: ISearchPaginationState = {
    // pagination
    resultByPage: {},
    currentPage: 0,
    numberOfResult: 0,
};

const initialSearchParamState = {
    searchFilters: {},
    searchFields: {},
    searchOrder: SearchOrder.Relevance,
    searchString: '',
    searchType: SearchType.Query,
};

const initialState: ISearchState = {
    // visuals
    // displayOption: DisplayOption.Grid,
    searchRequest: null,

    // authors
    searchAuthorChoices: [],

    pastSearchStateByType: {},

    ...initialPaginationState,
    ...initialSearchParamState,
};

export default function search(
    state = initialState,
    action: SearchAction | UserAction
): ISearchState {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@search/SEARCH_RESULT_RESET': {
                return {
                    ...state,
                    ...initialPaginationState,
                };
            }
            case '@@search/SEARCH_RESET': {
                return {
                    ...state,
                    ...initialPaginationState,
                    ...initialSearchParamState,
                };
            }
            case '@@search/SEARCH_STARTED': {
                draft.searchRequest = action.payload.searchRequest;
                return;
            }
            case '@@search/SEARCH_DONE': {
                const { result, page, count } = action.payload;
                draft.searchRequest = null;
                draft.resultByPage[page] = result;
                draft.numberOfResult = count;

                return;
            }
            case '@@search/SEARCH_RECEIVE_QUERY_PARAM': {
                const { queryParam } = action.payload;
                return {
                    ...state,
                    ...queryParam,
                    currentPage: Number(
                        queryParam['currentPage'] || state.currentPage
                    ),
                };
            }
            case '@@search/SEARCH_STRING_UPDATE': {
                draft.searchString = action.payload.searchString;
                return;
            }
            case '@@search/SEARCH_FILTER_UPDATE': {
                const { filterKey, filterValue } = action.payload;
                if (filterValue != null) {
                    draft.searchFilters[filterKey] = filterValue;
                } else {
                    delete draft.searchFilters[filterKey];
                }
                return;
            }
            case '@@search/SEARCH_FIELD_UPDATE': {
                const { field } = action.payload;
                if (field in draft.searchFields) {
                    delete draft.searchFields[field];
                } else {
                    draft.searchFields[field] = true;
                }
                return;
            }
            case '@@search/SEARCH_ORDER_UPDATE': {
                draft.searchOrder = action.payload.orderKey;
                return;
            }
            case '@@search/SEARCH_TYPE_UPDATE': {
                // Save the current state into past state
                draft.pastSearchStateByType[draft.searchType] = {
                    searchFields: draft.searchFields,
                    searchFilters: draft.searchFilters,
                };

                // rehydrate from past state, except for the search string
                const searchStateForNewType = draft.pastSearchStateByType[
                    action.payload.searchType
                ] ?? {
                    searchFilters: {},
                    searchFields:
                        draft.searchType === SearchType.Table
                            ? {
                                  table_name: true,
                                  description: true,
                                  column: true,
                              }
                            : {},
                };

                draft.searchType = action.payload.searchType;
                draft.searchFilters = searchStateForNewType.searchFilters;
                draft.searchFields = searchStateForNewType.searchFields;
                return;
            }
            case '@@search/SEARCH_GO_TO_PAGE': {
                draft.currentPage = action.payload.page;
                return;
            }
            case '@@search/SEARCH_ADD_AUTHOR': {
                const { id, name } = action.payload;
                if (
                    draft.searchAuthorChoices.every(
                        (choice) => choice.id !== id
                    )
                ) {
                    draft.searchAuthorChoices.push({
                        name,
                        id,
                    });
                }

                return;
            }
            case '@@user/LOGIN_USER': {
                const { id, username, fullname } = action.payload.userInfo;
                const name = fullname || username;

                if (
                    draft.searchAuthorChoices.every(
                        (choice) => choice.id !== id
                    )
                ) {
                    draft.searchAuthorChoices.push({
                        name,
                        id,
                    });
                }
                return;
            }
        }
    });
}
