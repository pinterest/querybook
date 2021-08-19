import { IAdminMetastore, IMetastoreLoader } from 'const/admin';
import { ITaskSchedule } from 'const/schedule';
import ds from 'lib/datasource';

export function getAdminMetastores() {
    return ds.fetch<IAdminMetastore[]>('/admin/query_metastore/');
}

export function getAdminMetastoreLoaders() {
    return ds.fetch<IMetastoreLoader[]>('/admin/query_metastore_loader/');
}

export function getAdminMetastoreUpdateSchedule(metastoreId: number) {
    return ds.fetch<ITaskSchedule>(
        `/schedule/name/update_metastore_${metastoreId}/`
    );
}

export function createAdminMetastore(
    name: IAdminMetastore['name'],
    metastoreParams: IAdminMetastore['metastore_params'],
    loader: IAdminMetastore['loader'],
    aclControl: IAdminMetastore['acl_control']
) {
    return ds.save<IAdminMetastore>(`/admin/query_metastore/`, {
        name,
        metastore_params: metastoreParams,
        loader,
        acl_control: aclControl,
    });
}

export function updateAdminMetastore(
    metastoreId: number,
    metastore: Partial<IAdminMetastore>
) {
    return ds.update<IAdminMetastore>(
        `/admin/query_metastore/${metastoreId}/`,
        metastore
    );
}

export function deleteAdminMetastore(metastoreId: number) {
    return ds.delete(`/admin/query_metastore/${metastoreId}/`);
}

export function recoverAdminMetastore(metastoreId: number) {
    return ds.update<IAdminMetastore>(
        `/admin/query_metastore/${metastoreId}/recover/`
    );
}
