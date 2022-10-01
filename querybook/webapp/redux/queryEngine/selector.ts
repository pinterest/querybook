import { createSelector } from 'reselect';

import type { IQueryEngine } from 'const/queryEngine';
import { arrayGroupByField } from 'lib/utils';
import { IStoreState } from 'redux/store/types';

import { IQueryEngineStatus } from './types';

const unknownQueryEngine: IQueryEngine = {
    id: -1,
    metastore_id: -1,
    description: 'Unknown Engine',
    executor: 'unknown',
    language: 'presto',
    name: 'unknown',
    feature_params: {},
};

const queryEngineByIdSelector = (state: IStoreState) =>
    state.queryEngine.queryEngineById;

const queryEngineStatusByIdSelector = (state: IStoreState) =>
    state.queryEngine.queryEngineStatusById;

const engineIdsInEnvironmentSelector = (state: IStoreState) =>
    state.environment.environmentEngineIds[
        state.environment.currentEnvironmentId
    ] || [];

const userQueryEngineIdSelector = (state: IStoreState) =>
    state.queryEngine.userQueryEngineIds || new Set();

export const queryEngineSelector = createSelector(
    queryEngineByIdSelector,
    engineIdsInEnvironmentSelector,
    (queryEngineById, engineIds) => engineIds.map((id) => queryEngineById[id])
);

export const availableQueryEngineSelector = createSelector(
    queryEngineSelector,
    userQueryEngineIdSelector,
    (queryEngines, userQueryEngineIds) =>
        queryEngines.filter((engine) => userQueryEngineIds.has(engine.id))
);

export const queryEngineByIdEnvSelector = createSelector(
    queryEngineSelector,
    (queryEngines) =>
        new Proxy(arrayGroupByField(queryEngines), {
            get: (engineById, name: string) =>
                name in engineById ? engineById[name] : unknownQueryEngine,
        })
);

export const availableQueryEngineByIdEnvSelector = createSelector(
    availableQueryEngineSelector,
    (queryEngines) =>
        new Proxy(arrayGroupByField(queryEngines), {
            get: (engineById, name: string) =>
                name in engineById ? engineById[name] : unknownQueryEngine,
        })
);

export const queryEngineStatusAndEngineIdsSelector = createSelector(
    queryEngineStatusByIdSelector,
    engineIdsInEnvironmentSelector,
    userQueryEngineIdSelector,
    (queryEngineStatusById, engineIds, userQueryEngineIds) =>
        engineIds
            .filter((engineId) => userQueryEngineIds.has(engineId))
            .reduce((pairs, id) => {
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
