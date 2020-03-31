import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { IStoreState } from '../store/types';
import { IQueryEngine, IEngineStatusData } from 'const/queryEngine';

export interface IQueryEngineReceiveAction extends Action {
    type: '@@queryEngine/RECEIVE';
    payload: {
        queryEngines: IQueryEngine[];
        environmentId: number;
    };
}

export interface IQueryEngineStatusLoadingAction extends Action {
    type: '@@queryEngine/STATUS_LOADING';
    payload: {
        id: number;
    };
}

export interface IQueryEngineStatusReceiveAction extends Action {
    type: '@@queryEngine/STATUS_RECEIVE';
    payload: {
        id: number;
        status: IQueryEngineStatus;
    };
}

export type QueryEngineAction =
    | IQueryEngineReceiveAction
    | IQueryEngineStatusLoadingAction
    | IQueryEngineStatusReceiveAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    QueryEngineAction
>;

export interface IQueryEngineStatus {
    data?: IEngineStatusData;
    updated_at?: number;
    failed: boolean;
    loading: boolean;
}

export interface IQueryEngineState {
    queryEngineById: Record<number, IQueryEngine>;
    queryEngineStatusById: Record<number, IQueryEngineStatus>;
}
