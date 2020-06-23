import produce from 'immer';
import { IGlobalStateState, GlobalStateAction } from './types';

export const defaultGlobalState: IGlobalStateState = {};

export default function globalState(
    state = defaultGlobalState,
    action: GlobalStateAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@globalState/SET_GLOBAL_STATE': {
                const { key, value } = action.payload;
                draft[key] = value;
                return;
            }
        }
    });
}
