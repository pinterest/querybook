import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IStoreState } from '../store/types';

export interface IEnvironment {
    id: number;
    name: string;
    description: string;
    image: string;
    public: boolean;
    hidden: boolean;
    archived: boolean;
    shareable: boolean;
}

export interface IReceiveEnvironmentsAction extends Action {
    type: '@@environment/RECEIVE_ENVIRONMENTS';
    payload: {
        environmentById: Record<number, IEnvironment>;
    };
}

export interface IReceiveUserEnvironmentsAction extends Action {
    type: '@@environment/RECEIVE_USER_ENVIRONMENT_IDS';
    payload: {
        userEnvironmentIds: number[];
    };
}

export interface ISetEnvironmentByIdAction extends Action {
    type: '@@environment/SET_ENVIRONMENT_BY_ID';
    payload: {
        id: number;
    };
}

export type EnvironmentAction =
    | IReceiveEnvironmentsAction
    | ISetEnvironmentByIdAction
    | IReceiveUserEnvironmentsAction;

export interface IEnvironmentState {
    environmentById: Record<number, IEnvironment>;
    userEnvironmentIds: Set<number>;
    currentEnvironmentId?: number;

    environmentEngineIds: Record<number, number[]>;
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    EnvironmentAction
>;

export type ThunkDispatch = UntypedThunkDispatch<
    IStoreState,
    undefined,
    EnvironmentAction
>;
