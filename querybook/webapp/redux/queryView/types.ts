import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { ICancelablePromise } from 'lib/datasource';
import { DataDocAction } from 'redux/dataDoc/types';
import { QueryExecutionAction } from 'redux/queryExecutions/types';
import { IStoreState } from 'redux/store/types';

export interface IQueryViewFilter {
    user?: number;
    engine?: number;
    status?: number;
}

export interface IQueryViewSearchStartedAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_SEARCH_STARTED';
    payload: {
        searchRequest: ICancelablePromise<any>;
    };
}

export interface IQueryViewSearchDoneAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_SEARCH_DONE';
    payload: {
        queryExecutionIds: number[];
        endOfList: boolean;
        offset: number;
    };
}

export interface IQueryViewSearchFailedAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_SEARCH_FAILED';
    payload: {
        error: any;
    };
}

export interface IQueryViewReceiveQueryParamAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_RECEIVE_QUERY_PARAM';
    payload: {
        queryParam: IQueryViewFilter;
    };
}

export interface IQueryViewSearchFilterUpdateAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_SEARCH_FILTER_UPDATE';
    payload: {
        filterKey: string;
        filterVal: any;
    };
}

export interface IQueryViewSearchOrderUpdateAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_SEARCH_ORDER_UPDATE';
    payload: {
        orderBy: string;
    };
}

export interface IQueryViewResetAction extends Action {
    type: '@@querySnippets/QUERY_VIEW_RESET';
}

export type QueryViewAction =
    | IQueryViewSearchStartedAction
    | IQueryViewSearchDoneAction
    | IQueryViewSearchFailedAction
    | IQueryViewReceiveQueryParamAction
    | IQueryViewSearchFilterUpdateAction
    | IQueryViewSearchOrderUpdateAction
    | IQueryViewResetAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    QueryViewAction | DataDocAction | QueryExecutionAction
>;

export interface IQueryViewSearchState {
    // pagination
    queryExecutionIds: number[];
    offset: number;

    // Boolean variable to indicate no more fetching is possible
    endOfList: boolean;
    isLoading: boolean;
    searchRequest: ICancelablePromise<any>;
}

export interface IQueryViewState extends IQueryViewSearchState {
    filters: IQueryViewFilter;
    orderBy: string;
}
