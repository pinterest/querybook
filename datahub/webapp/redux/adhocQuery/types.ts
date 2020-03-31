import { Action } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { IStoreState } from '../store/types';

export interface IReceiveAdhocQueryAction extends Action {
    type: '@@adhocQuery/RECEIVE_ADHOC_QUERY';
    payload: {
        query: string;
    };
}

export interface IReceiveAdhocQueryEngineIdAction extends Action {
    type: '@@adhocQuery/RECEIVE_ADHOC_QUERY_ENGINE_ID';
    payload: {
        engineId?: number;
    };
}

export interface IReceiveAdhocQueryExecutionIdAction extends Action {
    type: '@@adhocQuery/RECEIVE_ADHOC_QUERY_EXECUTION_ID';
    payload: {
        executionId?: number;
    };
}

export type AdhocQueryAction =
    | IReceiveAdhocQueryAction
    | IReceiveAdhocQueryEngineIdAction
    | IReceiveAdhocQueryExecutionIdAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    AdhocQueryAction
>;

export type ThunkDispatch = ThunkDispatch<
    IStoreState,
    undefined,
    AdhocQueryAction
>;

export interface IAdhocQueryState {
    query: string;
    engineId?: number;
    executionId?: number;
}
