import { IAdminEnvironment } from 'const/admin';
import { IQueryEngine, IQueryEngineEnvironment } from 'const/queryEngine';
import ds from 'lib/datasource';

export function getEnvironments() {
    return ds.fetch<IAdminEnvironment[]>('/admin/environment/');
}

export function createEnvironment(
    name: string,
    description: string,
    image: string,
    _public: boolean,
    hidden: boolean,
    shareable: boolean
) {
    return ds.save<IAdminEnvironment>(`/admin/environment/`, {
        name,
        description,
        image,
        public: _public,
        hidden,
        shareable,
    });
}

export function updateEnvironment(
    id: number,
    environment: Partial<IAdminEnvironment>
) {
    return ds.update<IAdminEnvironment>(
        `/admin/environment/${id}/`,
        environment
    );
}

export function deleteEnvironment(id: number) {
    return ds.delete(`/admin/environment/${id}/`);
}

export function recoverEnvironment(id: number) {
    return ds.update<IAdminEnvironment>(`/admin/environment/${id}/recover/`);
}

export function getQueryEnginesInEnvironment(envId: number) {
    return ds.fetch<IQueryEngine[]>(
        `/admin/environment/${envId}/query_engine/`
    );
}

export function addQueryEngineToEnvironment(envId: number, engineId: number) {
    return ds.save<IQueryEngineEnvironment>(
        `/admin/environment/${envId}/query_engine/${engineId}/`
    );
}

export function removeQueryEngineToEnvironment(
    envId: number,
    engineId: number
) {
    return ds.delete(`/admin/environment/${envId}/query_engine/${engineId}/`);
}

export function swapQueryEnginesInEnvironment(
    envId: number,
    fromIndex: number,
    toIndex: number
) {
    return ds.save<null>(
        `/admin/environment/${envId}/query_engine/${fromIndex}/${toIndex}/`
    );
}
