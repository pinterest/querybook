import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { IStoreState } from 'redux/store/types';

export interface IQueryForm {
    id?: number;
    title: string;
    context: string;
    engine_id: number;
    description: string;
    is_public: boolean;
    golden: boolean;
}

export interface IQuerySnippet {
    id: number;
    title: string;

    context: string;
    description: string;
    is_public: boolean;
    golden: boolean;

    created_at?: number;
    created_by?: number;
    engine_id: number;
    last_updated_by?: number;
    updated_at?: number;
}

export interface IQuerySnippetSearchFilter {
    engine_id?: number;
    is_public?: boolean;
    golden?: boolean;
}

export interface IReceiveQuerySnippetAction extends Action {
    type: '@@querySnippets/RECEIVE_QUERY_SNIPPET';
    payload: {
        querySnippet: IQuerySnippet;
    };
}

export interface IReceiveQuerySnippetsAction extends Action {
    type: '@@querySnippets/RECEIVE_QUERY_SNIPPETS';
    payload: {
        querySnippets: IQuerySnippet[];
    };
}

export interface IRemoveQuerySnippetAction extends Action {
    type: '@@querySnippets/REMOVE_QUERY_SNIPPET';
    payload: {
        querySnippet: IQuerySnippet;
    };
}

export type QuerySnippetsAction =
    | IReceiveQuerySnippetAction
    | IReceiveQuerySnippetsAction
    | IRemoveQuerySnippetAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    QuerySnippetsAction
>;

export interface IQuerySnippetsState {
    querySnippetById: Record<number, IQuerySnippet>;

    // for search results
    querySnippetIds: number[];
}
