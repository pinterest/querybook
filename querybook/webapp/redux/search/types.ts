import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { ISearchPreview } from 'const/search';
import { ICancelablePromise } from 'lib/datasource';

import { IStoreState } from '../store/types';

export const RESULT_PER_PAGE = 20;
export enum SearchOrder {
    Recency = 'Recency',
    Relevance = 'Relevance',
}

export enum DisplayOption {
    Grid = 'Grid',
    Table = 'Table',
}

export enum SearchType {
    DataDoc = 'DataDoc',
    Query = 'Query',
    Table = 'Table',
    Board = 'Board',
}

export interface ISearchDoneAction extends Action {
    type: '@@search/SEARCH_DONE';
    payload: {
        result: ISearchPreview[];
        page: number;
        count: number;
    };
}

export interface ISearchStartedAction extends Action {
    type: '@@search/SEARCH_STARTED';
    payload: {
        searchRequest: ICancelablePromise<any>;
    };
}

export interface ISearchFailedAction extends Action {
    type: '@@search/SEARCH_FAILED';
    payload: {
        error: any;
    };
}

export interface ISearchReceiveQueryParamAction extends Action {
    type: '@@search/SEARCH_RECEIVE_QUERY_PARAM';
    payload: {
        queryParam: Record<string, unknown>;
    };
}

export interface ISearchStringUpdateAction extends Action {
    type: '@@search/SEARCH_STRING_UPDATE';
    payload: {
        searchString: string;
    };
}

export interface ISearchFilterUpdateAction extends Action {
    type: '@@search/SEARCH_FILTER_UPDATE';
    payload: {
        filterKey: string;
        filterValue: any;
    };
}

export interface ISearchFieldUpdateAction extends Action {
    type: '@@search/SEARCH_FIELD_UPDATE';
    payload: {
        field: string;
    };
}

export interface ISearchOrderUpdateAction extends Action {
    type: '@@search/SEARCH_ORDER_UPDATE';
    payload: {
        orderKey: SearchOrder;
    };
}

export interface ISearchTypeUpdateAction extends Action {
    type: '@@search/SEARCH_TYPE_UPDATE';
    payload: {
        searchType: SearchType;
    };
}

export interface ISearchResultResetAction extends Action {
    type: '@@search/SEARCH_RESULT_RESET';
}

export interface IResetSearchAction extends Action {
    type: '@@search/SEARCH_RESET';
}

export interface ISearchGoToPageAction extends Action {
    type: '@@search/SEARCH_GO_TO_PAGE';
    payload: {
        page: number;
    };
}

export interface ISearchAddAuthorAction extends Action {
    type: '@@search/SEARCH_ADD_AUTHOR';
    payload: {
        id: number;
        name: string;
    };
}

export type SearchAction =
    | ISearchDoneAction
    | ISearchStartedAction
    | ISearchFailedAction
    | ISearchReceiveQueryParamAction
    | ISearchStringUpdateAction
    | ISearchFilterUpdateAction
    | ISearchFieldUpdateAction
    | ISearchOrderUpdateAction
    | ISearchTypeUpdateAction
    | ISearchResultResetAction
    | IResetSearchAction
    | ISearchGoToPageAction
    | ISearchAddAuthorAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    SearchAction
>;

export interface ISearchPaginationState {
    resultByPage: Record<number, ISearchPreview[]>;
    currentPage: number;
    numberOfResult: number;
}

type TSearchField = Partial<
    Record<'table_name' | 'description' | 'column', boolean>
>;

export interface ISearchState extends ISearchPaginationState {
    searchFilters: Record<string, any>;
    searchFields: TSearchField;
    searchOrder: SearchOrder;
    searchType: SearchType;
    searchString: string;

    // visuals
    // displayOption: DisplayOption;
    searchRequest: ICancelablePromise<any>;

    // authors
    searchAuthorChoices: Array<{
        name: string;
        id: number;
    }>;

    pastSearchStateByType: Partial<
        Record<
            SearchType,
            {
                searchFilters: Record<string, any>;
                searchFields: TSearchField;
            }
        >
    >;
}
