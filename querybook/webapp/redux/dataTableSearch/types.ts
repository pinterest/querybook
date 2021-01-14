import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { IStoreState } from '../store/types';
import { ICancelablePromise } from 'lib/datasource';

export interface ITableSearchResult {
    id: number;
    name: string;
    schema: string;
}

export interface ITableSearchFilters {
    golden?: true;
    tags?: string[];
    startDate?: number;
    endDate?: number;
    schema?: string;
}

export interface IDataTableSearchResultResetAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_RESULT_RESET';
}

export interface IDataTableSearchResultClearAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_RESET';
}

export interface IDataTableSearchStartedAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_STARTED';
    payload: {
        searchRequest: Promise<any>;
    };
}

export interface IDataTableSearchDoneAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_DONE';
    payload: {
        results: ITableSearchResult[];
        count: number;
    };
}

export interface IDataTableSearchFailedAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_FAILED';
    payload: {
        error: any;
    };
}

export interface IDataTableSearchStringUpdateAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_STRING_UPDATE';
    payload: {
        searchString: string;
    };
}

export interface IDataTableSearchSelectMetastoreAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_SELECT_METASTORE';
    payload: {
        metastoreId: number;
    };
}

export interface IDataTableSearchFilterUpdateAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_FILTER_UPDATE';
    payload: {
        filterKey: string;
        filterValue: any;
    };
}

export interface IDataTableSearchResetFilterAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_FILTER_RESET';
}

export interface IDataTableSearchMoreAction extends Action {
    type: '@@dataTableSearch/DATA_TABLE_SEARCH_MORE';
    payload: {
        results: ITableSearchResult[];
    };
}

export type DataTableSearchAction =
    | IDataTableSearchResultResetAction
    | IDataTableSearchResultClearAction
    | IDataTableSearchStartedAction
    | IDataTableSearchDoneAction
    | IDataTableSearchFailedAction
    | IDataTableSearchStringUpdateAction
    | IDataTableSearchFilterUpdateAction
    | IDataTableSearchResetFilterAction
    | IDataTableSearchMoreAction
    | IDataTableSearchSelectMetastoreAction;

export interface IDataTableSearchPaginationState {
    results: ITableSearchResult[];
    count: number;
}

export interface IDataTableSearchState extends IDataTableSearchPaginationState {
    searchFilters: ITableSearchFilters;
    searchFields: Partial<
        Record<'table_name' | 'description' | 'column', boolean>
    >;
    searchString: string;
    searchRequest?: ICancelablePromise<any>;
    metastoreId?: number;
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    DataTableSearchAction
>;
