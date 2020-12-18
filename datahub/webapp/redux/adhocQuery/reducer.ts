import { produce } from 'immer';

import { AdhocQueryState, AdhocQueryAction } from './types';
import { EnvironmentAction } from 'redux/environment/types';
import localStore from 'lib/local-store';
import { AdhocQueryValue, ADHOC_QUERY_KEY } from 'lib/local-store/const';
import { saveAdhocQuery } from './persistence';

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
            case '@@adhocQuery/CLEAR_ADHOC_QUERY': {
                const { environmentId } = action.payload;
                delete draft[environmentId];
                return;
            }
        }
    });
