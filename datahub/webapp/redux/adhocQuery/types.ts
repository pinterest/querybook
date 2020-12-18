import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';
import { IStoreState } from '../store/types';
import { IAdhocQuery } from 'const/adhocQuery';

export interface ISetAdhocQueryAction extends Action {
    type: '@@adhocQuery/SET_ADHOC_QUERY';
    payload: {
        adhocQuery: Partial<IAdhocQuery>;
        environmentId: number;
    };
}

export interface IClearAdhocQueryAction extends Action {
    type: '@@adhocQuery/CLEAR_ADHOC_QUERY';
    payload: {
        environmentId: number;
    };
}

export type AdhocQueryAction = ISetAdhocQueryAction | IClearAdhocQueryAction;

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
