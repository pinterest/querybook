import { ISetGlobalStateAction } from './types';

export function setGlobalValue(key: string, value: any): ISetGlobalStateAction {
    return {
        type: '@@globalState/SET_GLOBAL_STATE',
        payload: {
            key,
            value,
        },
    };
}
