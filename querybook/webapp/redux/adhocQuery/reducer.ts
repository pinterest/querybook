import { produce } from 'immer';

import { EnvironmentAction } from 'redux/environment/types';

import { saveAdhocQuery } from './persistence';
import {
    AdhocQueryAction,
    IRemoveSelectedExecutionAction,
    AdhocQueryState,
} from './types';

const initialState: Readonly<AdhocQueryState> = {};

export default (
    state = initialState,
    action:
        | AdhocQueryAction
        | EnvironmentAction
        | IRemoveSelectedExecutionAction
) =>
    produce(state, (draft) => {
        switch (action.type) {
            case '@@adhocQuery/SET_ADHOC_QUERY': {
                const { adhocQuery, environmentId } = action.payload;
                draft[environmentId] = {
                    ...draft[environmentId],
                    ...adhocQuery,
                    selectedExec: adhocQuery.executionId,
                };
                saveAdhocQuery(draft[environmentId], environmentId);
                return;
            }
            case '@@adhocQuery/REMOVE_SELECTED_EXECUTION': {
                const { environmentId } = action.payload;
                draft[environmentId] = {
                    ...draft[environmentId],
                    selectedExec: null,
                };
                saveAdhocQuery(draft[environmentId], environmentId);
                return;
            }
        }
    });
