import { produce } from 'immer';

import { IAdhocQueryState, AdhocQueryAction } from './types';
import { EnvironmentAction } from 'redux/environment/types';

const initialState: Readonly<IAdhocQueryState> = {
    query: '',
    engineId: null,
    executionId: null,
};

export default (
    state = initialState,
    action: AdhocQueryAction | EnvironmentAction
) =>
    produce(state, (draft) => {
        switch (action.type) {
            case '@@adhocQuery/RECEIVE_ADHOC_QUERY': {
                draft.query = action.payload.query;
                return;
            }
            case '@@adhocQuery/RECEIVE_ADHOC_QUERY_ENGINE_ID': {
                draft.engineId = action.payload.engineId;
                return;
            }
            case '@@adhocQuery/RECEIVE_ADHOC_QUERY_EXECUTION_ID': {
                draft.executionId = action.payload.executionId;
                return;
            }
            case '@@environment/SET_ENVIRONMENT_BY_ID': {
                return initialState;
            }
        }
    });
