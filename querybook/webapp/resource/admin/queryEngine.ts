import { IAdminQueryEngine, IQueryEngineTemplate } from 'const/admin';
import ds from 'lib/datasource';

export function getAdminQueryEngines() {
    return ds.fetch<IAdminQueryEngine[]>('/admin/query_engine/');
}

export function getQueryEngineTemplate() {
    return ds.fetch<IQueryEngineTemplate[]>('/admin/query_engine_template/');
}

export function getQueryEngineCheckerNames() {
    return ds.fetch<string[]>('/admin/query_engine_status_checker/');
}

export function createQueryEngine(queryEngine: IAdminQueryEngine) {
    return ds.save<IAdminQueryEngine>(`/admin/query_engine/`, {
        name: queryEngine.name,
        description: queryEngine.description,
        language: queryEngine.language,
        executor: queryEngine.executor,
        executor_params: queryEngine.executor_params,
        metastore_id: queryEngine.metastore_id ?? null,
        status_checker: queryEngine.status_checker,
    });
}

export function updateQueryEngine(
    queryEngineId: number,
    queryEngine: Partial<IAdminQueryEngine>
) {
    return ds.update<IAdminQueryEngine>(
        `/admin/query_engine/${queryEngineId}/`,
        queryEngine
    );
}

export function deleteQueryEngine(queryEngineId: number) {
    return ds.delete(`/admin/query_engine/${queryEngineId}/`);
}

export function recoverQueryEngine(queryEngineId: number) {
    return ds.save<IAdminQueryEngine>(
        `/admin/query_engine/${queryEngineId}/recover/`
    );
}
