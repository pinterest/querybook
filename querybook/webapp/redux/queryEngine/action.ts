import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import { QueryEngineResource } from 'resource/queryEngine';

import { queryEngineByIdEnvSelector } from './selector';
import { ThunkResult } from './types';

export function loadQueryEngine(): ThunkResult<Promise<IQueryEngine[]>> {
    return async (dispatch, getState) => {
        const environmentId = getState().environment.currentEnvironmentId;
        const { data } = await QueryEngineResource.getByEnvironmentId(
            environmentId
        );
        dispatch({
            type: '@@queryEngine/RECEIVE',
            payload: {
                queryEngines: data,
                environmentId,
            },
        });

        return data;
    };
}

export function fetchSystemStatus(
    engineId: number,
    force: boolean = false
): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const state = getState();
        const status = state.queryEngine.queryEngineStatusById[engineId];

        if (!force && status) {
            return;
        }

        try {
            dispatch({
                type: '@@queryEngine/STATUS_LOADING',
                payload: {
                    id: engineId,
                },
            });

            const { data } = await QueryEngineResource.getSystemStatus(
                engineId
            );

            dispatch({
                type: '@@queryEngine/STATUS_RECEIVE',
                payload: {
                    id: engineId,
                    status: {
                        data,
                        updated_at: Date.now() / 1000,
                        failed: false,
                        loading: false,
                    },
                },
            });
        } catch (error) {
            dispatch({
                type: '@@queryEngine/STATUS_RECEIVE',
                payload: {
                    id: engineId,
                    status: {
                        warningLevel: QueryEngineStatus.UNAVAILABLE,
                        updated_at: Date.now() / 1000,
                        failed: true,
                        loading: false,
                    },
                },
            });
        }
    };
}

export function fetchAllSystemStatus(force = false): ThunkResult<Promise<any>> {
    return async (dispatch, getState) =>
        Promise.all(
            Object.keys(queryEngineByIdEnvSelector(getState())).map(
                (engineId) =>
                    dispatch(fetchSystemStatus(Number(engineId), force))
            )
        );
}
