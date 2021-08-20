import { IEngineStatusData, IQueryEngine } from 'const/queryEngine';
import ds from 'lib/datasource';

export const QueryEngineResource = {
    getByEnvironmentId: (envId: number) =>
        ds.fetch<IQueryEngine[]>('/query_engine/', {
            environment_id: envId,
        }),

    getSystemStatus: (engineId: number) =>
        ds.fetch<IEngineStatusData>(`/query_engine/${engineId}/status/`),
};
