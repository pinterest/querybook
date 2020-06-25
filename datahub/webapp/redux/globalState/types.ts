import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { IStoreState } from 'redux/store/types';

export interface ISetGlobalStateAction extends Action {
    type: '@@globalState/SET_GLOBAL_STATE';
    payload: {
        key: string;
        value: any;
    };
}
export type GlobalStateAction = ISetGlobalStateAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    GlobalStateAction
>;

export interface IGlobalStateState {
    [key: string]: any;
}
