import { sortBy } from 'lodash';
import { createSelector } from 'reselect';

import { arrayGroupByField } from 'lib/utils';
import { IStoreState } from 'redux/store/types';
import { IQueryEngine } from 'const/queryEngine';
import { IQueryEngineStatus } from './types';

const queryEngineByIdSelector = (state: IStoreState) =>
    state.queryEngine.queryEngineById;

const queryEngineStatusByIdSelector = (state: IStoreState) =>
    state.queryEngine.queryEngineStatusById;

const engineIdsInEnvironmentSelector = (state: IStoreState) =>
    state.environment.environmentEngineIds[
        state.environment.currentEnvironmentId
    ] || [];

export const queryEngineByIdEnvSelector = createSelector(
    queryEngineByIdSelector,
    engineIdsInEnvironmentSelector,
    (queryEgnineById, engineIds) =>
        arrayGroupByField(engineIds.map((id) => queryEgnineById[id])) as Record<
            number,
            IQueryEngine
        >
);

export const queryEngineSelector = createSelector(
    queryEngineByIdEnvSelector,
    (queryEngineById) => sortBy(Object.values(queryEngineById), ['id'])
);

export const queryEngineStatusByIdEnvSelector = createSelector(
    queryEngineStatusByIdSelector,
    engineIdsInEnvironmentSelector,
    (queryEngineStatusById, engineIds) =>
        engineIds.reduce((hash, id) => {
            if (id in queryEngineStatusById) {
                hash[id] = queryEngineStatusById[id];
            }
            return hash;
        }, {}) as Record<number, IQueryEngineStatus>
);
