import { produce } from 'immer';

import { IQueryEngineState, QueryEngineAction } from './types';

const initialState: IQueryEngineState = {
    queryEngineById: {},
    queryEngineStatusById: {},
    queryTranspilers: [],
};

export default function queryEngine(
    state = initialState,
    action: QueryEngineAction
): IQueryEngineState {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@queryEngine/RECEIVE': {
                for (const engine of action.payload.queryEngines) {
                    draft.queryEngineById[engine.id] = engine;
                }
                return;
            }
            case '@@queryEngine/STATUS_LOADING': {
                const { id } = action.payload;
                draft.queryEngineStatusById[id] = {
                    loading: true,
                    failed: false,
                };
                return;
            }
            case '@@queryEngine/STATUS_RECEIVE': {
                const { id, status } = action.payload;
                draft.queryEngineStatusById[id] = status;
                return;
            }
            case '@@queryEngine/TRANSPILER_RECEIVE': {
                draft.queryTranspilers = action.payload.transpilers;
                return;
            }
        }
    });
}
