import { createSelector } from 'reselect';

import { IStoreState } from 'redux/store/types';

const environmentByIdSelector = (state: IStoreState) =>
    state.environment.environmentById || {};
const currentEnvironmentIdSelector = (state: IStoreState) =>
    state.environment.currentEnvironmentId;
const userEnvironmentIdSelector = (state: IStoreState) =>
    state.environment.userEnvironmentIds || [];

export const currentEnvironmentSelector = createSelector(
    environmentByIdSelector,
    currentEnvironmentIdSelector,
    (environmentById, envId) => environmentById?.[envId]
);

export const environmentsSelector = createSelector(
    environmentByIdSelector,
    (environmentById) =>
        Object.values(environmentById).sort((a, b) => a.id - b.id)
);

export const userEnvironmentNamesSelector = createSelector(
    userEnvironmentIdSelector,
    environmentByIdSelector,
    (userEnvironmentIds, environmentById) =>
        new Set(
            ...[
                [...userEnvironmentIds]
                    .filter((id) => id in environmentById)
                    .map((id) => environmentById[id].name),
            ]
        )
);

export const orderedEnvironmentsSelector = createSelector(
    environmentsSelector,
    userEnvironmentNamesSelector,
    (environments, userEnvironmentNames) =>
        environments.sort(
            (envA, envB) =>
                Number(userEnvironmentNames.has(envB.name)) -
                Number(userEnvironmentNames.has(envA.name))
        )
);

export const availableEnvironmentsSelector = createSelector(
    environmentsSelector,
    userEnvironmentNamesSelector,
    (environments, userEnvironmentNames) =>
        environments.filter((environment) =>
            userEnvironmentNames.has(environment.name)
        )
);
