import { IAdminQueryEngine, IQueryEngineTemplate } from 'const/admin';
import type { IEngineStatusData, IQueryValidator } from 'const/queryEngine';
import ds from 'lib/datasource';

export const AdminQueryEngineResource = {
    getAll: () => ds.fetch<IAdminQueryEngine[]>('/admin/query_engine/'),

    getTemplates: () =>
        ds.fetch<IQueryEngineTemplate[]>('/admin/query_engine_template/'),

    getCheckerNames: () =>
        ds.fetch<string[]>('/admin/query_engine_status_checker/'),

    getTableUploadExporterNames: () =>
        ds.fetch<string[]>('/admin/table_upload/exporter/'),

    getQueryValidators: () =>
        ds.fetch<IQueryValidator[]>('/admin/query_validator/'),

    create: (queryEngine: IAdminQueryEngine) =>
        ds.save<IAdminQueryEngine>(`/admin/query_engine/`, {
            name: queryEngine.name,
            description: queryEngine.description,
            language: queryEngine.language,
            executor: queryEngine.executor,
            executor_params: queryEngine.executor_params,
            metastore_id: queryEngine.metastore_id ?? null,
            feature_params: queryEngine.feature_params,
        }),

    update: (queryEngineId: number, queryEngine: Partial<IAdminQueryEngine>) =>
        ds.update<IAdminQueryEngine>(
            `/admin/query_engine/${queryEngineId}/`,
            queryEngine
        ),

    delete: (queryEngineId: number) =>
        ds.delete(`/admin/query_engine/${queryEngineId}/`),

    recover: (queryEngineId: number) =>
        ds.save<IAdminQueryEngine>(
            `/admin/query_engine/${queryEngineId}/recover/`
        ),

    testConnection: (queryEngine: IAdminQueryEngine) =>
        ds.fetch<IEngineStatusData>('/admin/query_engine/connection/', {
            name: queryEngine.name,
            language: queryEngine.language,
            executor: queryEngine.executor,
            executor_params: queryEngine.executor_params,
            feature_params: queryEngine.feature_params,
        }),
};
