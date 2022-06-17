import { produce } from 'immer';

import { UserAction } from 'redux/user/types';

import {
    IQueryViewSearchState,
    IQueryViewState,
    QueryViewAction,
} from './types';

const initialSearchState: IQueryViewSearchState = {
    // pagination
    queryExecutionIds: [],
    offset: 0,
    // Boolean variable to indicate no more fetching is possible
    endOfList: false,
    isLoading: false,
    searchRequest: null,
};
const initialState: IQueryViewState = {
    filters: {
        user: null,
        engine: null,
        status: null,
    },
    orderBy: 'created_at',
    ...initialSearchState,
};

export default function queryView(
    state = initialState,
    action: QueryViewAction | UserAction
): IQueryViewState {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@querySnippets/QUERY_VIEW_RESET': {
                return {
                    ...state,
                    ...initialSearchState,
                };
            }
            case '@@querySnippets/QUERY_VIEW_SEARCH_STARTED': {
                const { searchRequest } = action.payload;
                draft.searchRequest = searchRequest;
                draft.isLoading = true;

                return;
            }
            case '@@querySnippets/QUERY_VIEW_SEARCH_DONE': {
                const { queryExecutionIds, endOfList, offset } = action.payload;

                for (const id of queryExecutionIds) {
                    if (!draft.queryExecutionIds.includes(id)) {
                        draft.queryExecutionIds.push(id);
                    }
                }
                draft.offset = offset;
                draft.isLoading = false;
                draft.endOfList = endOfList;
                return;
            }
            case '@@querySnippets/QUERY_VIEW_RECEIVE_QUERY_PARAM': {
                const { queryParam } = action.payload;
                for (const key of Object.keys(initialState.filters)) {
                    if (key in queryParam) {
                        if (['user', 'engine', 'status'].includes(key)) {
                            draft.filters[key] = Number(queryParam[key]);
                        }
                    }
                }
                return;
            }
            case '@@querySnippets/QUERY_VIEW_SEARCH_FILTER_UPDATE': {
                const { filterKey, filterVal } = action.payload;
                draft.filters[filterKey] = filterVal;
                return;
            }
            case '@@querySnippets/QUERY_VIEW_SEARCH_ORDER_UPDATE': {
                draft.orderBy = action.payload.orderBy;
                return;
            }
            case '@@user/LOGIN_USER': {
                draft.filters.user = action.payload.myUserInfo.uid;
                return;
            }
        }
    });
}
