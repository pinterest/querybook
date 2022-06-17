import { IAdminEnvironment } from 'const/admin';
import { IQueryEngine, IQueryEngineEnvironment } from 'const/queryEngine';
import { IUserInfo } from 'const/user';
import ds from 'lib/datasource';
import { IPaginatedResource } from 'resource/types';

export const AdminEnvironmentResource = {
    getAll: () => ds.fetch<IAdminEnvironment[]>('/admin/environment/'),
    create: (
        name: string,
        description: string,
        image: string,
        _public: boolean,
        hidden: boolean,
        shareable: boolean
    ) =>
        ds.save<IAdminEnvironment>(`/admin/environment/`, {
            name,
            description,
            image,
            public: _public,
            hidden,
            shareable,
        }),
    update: (id: number, environment: Partial<IAdminEnvironment>) =>
        ds.update<IAdminEnvironment>(`/admin/environment/${id}/`, environment),
    delete: (id: number) => ds.delete(`/admin/environment/${id}/`),
    recover: (id: number) =>
        ds.update<IAdminEnvironment>(`/admin/environment/${id}/recover/`),

    getQueryEngines: (envId: number) =>
        ds.fetch<IQueryEngine[]>(`/admin/environment/${envId}/query_engine/`),
    addQueryEngine: (envId: number, engineId: number) =>
        ds.save<IQueryEngineEnvironment>(
            `/admin/environment/${envId}/query_engine/${engineId}/`
        ),
    removeQueryEngine: (envId: number, engineId: number) =>
        ds.delete(`/admin/environment/${envId}/query_engine/${engineId}/`),

    swapQueryEngines: (envId: number, fromIndex: number, toIndex: number) =>
        ds.save<null>(
            `/admin/environment/${envId}/query_engine/${fromIndex}/${toIndex}/`
        ),

    getPaginatedUsers:
        (envId: number): IPaginatedResource<IUserInfo> =>
        (limit, offset) =>
            ds.fetch(`/admin/environment/${envId}/users/`, {
                limit,
                offset,
            }),

    addUser: (envId: number, uid: number) =>
        ds.save<null>(`/admin/environment/${envId}/user/${uid}/`),

    removeUser: (envId: number, uid: number) =>
        ds.delete(`/admin/environment/${envId}/user/${uid}/`),
};
