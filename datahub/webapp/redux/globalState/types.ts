import { Action } from 'redux';

export interface ISetGlobalStateAction extends Action {
    type: '@@globalState/SET_GLOBAL_STATE';
    payload: {
        key: string;
        value: any;
    };
}
export type GlobalStateAction = ISetGlobalStateAction;

export interface IGlobalStateState {
    [key: string]: any;
}
