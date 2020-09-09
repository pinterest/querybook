import { createSelector } from 'reselect';

import { arrayGroupByField } from 'lib/utils';
import { IStoreState } from 'redux/store/types';
import { IQueryEngineStatus } from './types';

const queryEngineByIdSelector = (state: IStoreState) =>
    state.queryEngine.queryEngineById;

const queryEngineStatusByIdSelector = (state: IStoreState) =>
    state.queryEngine.queryEngineStatusById;

const engineIdsInEnvironmentSelector = (state: IStoreState) =>
    state.environment.environmentEngineIds[
        state.environment.currentEnvironmentId
    ] || [];

export const queryEngineSelector = createSelector(
    queryEngineByIdSelector,
    engineIdsInEnvironmentSelector,
    (queryEgnineById, engineIds) => engineIds.map((id) => queryEgnineById[id])
);

export const queryEngineByIdEnvSelector = createSelector(
    queryEngineSelector,
    (queryEgnines) => arrayGroupByField(queryEgnines)
);

export const queryEngineStatusAndEngineIdsSelector = createSelector(
    queryEngineStatusByIdSelector,
    engineIdsInEnvironmentSelector,
    (queryEngineStatusById, engineIds) =>
        engineIds.reduce((pairs, id) => {
            if (id in queryEngineStatusById) {
                pairs.push([id, queryEngineStatusById[id]]);
            }
            return pairs;
        }, []) as Array<[number, IQueryEngineStatus]>
);

export const queryEngineStatusByIdEnvSelector = createSelector(
    queryEngineStatusAndEngineIdsSelector,
    (queryEngineStatusAndEngineIds) =>
        Object.fromEntries(queryEngineStatusAndEngineIds) as Record<
            number,
            IQueryEngineStatus
        >
);
