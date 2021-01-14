import { produce } from 'immer';
import { IEnvironmentState, EnvironmentAction } from './types';
import { DataDocAction } from '../dataDoc/types';
import { QueryEngineAction } from '../queryEngine/types';

const initialState: IEnvironmentState = {
    environmentById: {},
    userEnvironmentIds: new Set<number>(),
    currentEnvironmentId: null,

    environmentEngineIds: {},
};

export default function environment(
    state = initialState,
    action: EnvironmentAction | DataDocAction | QueryEngineAction
): IEnvironmentState {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@environment/RECEIVE_ENVIRONMENTS': {
                draft.environmentById = {
                    ...draft.environmentById,
                    ...action.payload.environmentById,
                };
                return;
            }
            case '@@environment/RECEIVE_USER_ENVIRONMENT_IDS': {
                draft.userEnvironmentIds = new Set(
                    action.payload.userEnvironmentIds
                );
                return;
            }
            case '@@environment/SET_ENVIRONMENT_BY_ID': {
                draft.currentEnvironmentId = action.payload.id;
                return;
            }
            case '@@queryEngine/RECEIVE': {
                const { environmentId, queryEngines } = action.payload;
                draft.environmentEngineIds[environmentId] = queryEngines.map(
                    ({ id }) => id
                );
                return;
            }
        }
    });
}
