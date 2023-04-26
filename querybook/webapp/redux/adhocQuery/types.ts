import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IAdhocQuery } from 'const/adhocQuery';

import { IStoreState } from '../store/types';

export interface ISetAdhocQueryAction extends Action {
    type: '@@adhocQuery/SET_ADHOC_QUERY';
    payload: {
        adhocQuery: Partial<IAdhocQuery>;
        environmentId: number;
    };
}

export interface IRemoveSelectedExecutionAction extends Action {
    type: '@@adhocQuery/REMOVE_SELECTED_EXECUTION';
    payload: {
        environmentId: number;
    };
}

export type AdhocQueryAction =
    | ISetAdhocQueryAction
    | IRemoveSelectedExecutionAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    AdhocQueryAction
>;

export type ThunkDispatch = UntypedThunkDispatch<
    IStoreState,
    undefined,
    AdhocQueryAction
>;

export type AdhocQueryState = Record<number, IAdhocQuery>;
