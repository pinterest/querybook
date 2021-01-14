import ds from 'lib/datasource';

import {
    IQueryEngine,
    IEngineStatusData,
    QueryEngineStatus,
} from 'const/queryEngine';
import { ThunkResult } from './types';
import { queryEngineByIdEnvSelector } from './selector';

export function loadQueryEngine(): ThunkResult<Promise<IQueryEngine>> {
    return async (dispatch, getState) => {
        const environmentId = getState().environment.currentEnvironmentId;
        const { data } = await ds.fetch('/query_engine/', {
            environment_id: environmentId,
        });
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

            const { data } = await ds.fetch<IEngineStatusData>(
                `/query_engine/${engineId}/status/`
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
            Object.keys(
                queryEngineByIdEnvSelector(getState())
            ).map((engineId) =>
                dispatch(fetchSystemStatus(Number(engineId), force))
            )
        );
}
