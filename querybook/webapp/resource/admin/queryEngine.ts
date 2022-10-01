import { IAdminQueryEngine, IQueryEngineTemplate } from 'const/admin';
import type { IEngineStatusData, IQueryValidator } from 'const/queryEngine';
import { IUserInfo } from 'const/user';
import ds from 'lib/datasource';
import { IPaginatedResource } from 'resource/types';

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

    getPaginatedUsers:
        (queryEngineId: number): IPaginatedResource<IUserInfo> =>
        (limit, offset) =>
            ds.fetch(`/admin/query_engine/${queryEngineId}/users/`, {
                limit,
                offset,
            }),

    addUser: (queryEngineId: number, uid: number) =>
        ds.save<null>(`/admin/query_engine/${queryEngineId}/user/${uid}/`),

    removeUser: (queryEngineId: number, uid: number) =>
        ds.delete(`/admin/query_engine/${queryEngineId}/user/${uid}/`),
};
