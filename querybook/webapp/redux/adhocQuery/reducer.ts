import { produce } from 'immer';

import { EnvironmentAction } from 'redux/environment/types';

import { saveAdhocQuery } from './persistence';
import { AdhocQueryAction, AdhocQueryState } from './types';

const initialState: Readonly<AdhocQueryState> = {};

export default (
    state = initialState,
    action: AdhocQueryAction | EnvironmentAction
) =>
    produce(state, (draft) => {
        switch (action.type) {
            case '@@adhocQuery/SET_ADHOC_QUERY': {
                const { adhocQuery, environmentId } = action.payload;
                draft[environmentId] = {
                    ...draft[environmentId],
                    ...adhocQuery,
                };
                saveAdhocQuery(draft[environmentId], environmentId);
                return;
            }
        }
    });
