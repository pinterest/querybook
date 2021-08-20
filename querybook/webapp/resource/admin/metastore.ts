import { IAdminMetastore, IMetastoreLoader } from 'const/admin';
import { ITaskSchedule } from 'const/schedule';
import ds from 'lib/datasource';

export const AdminMetastoreResource = {
    getAll: () => ds.fetch<IAdminMetastore[]>('/admin/query_metastore/'),
    getAllLoaders: () =>
        ds.fetch<IMetastoreLoader[]>('/admin/query_metastore_loader/'),

    getUpdateSchedule: (metastoreId: number) =>
        ds.fetch<ITaskSchedule>(
            `/schedule/name/update_metastore_${metastoreId}/`
        ),

    create: (
        name: IAdminMetastore['name'],
        metastoreParams: IAdminMetastore['metastore_params'],
        loader: IAdminMetastore['loader'],
        aclControl: IAdminMetastore['acl_control']
    ) =>
        ds.save<IAdminMetastore>(`/admin/query_metastore/`, {
            name,
            metastore_params: metastoreParams,
            loader,
            acl_control: aclControl,
        }),

    update: (metastoreId: number, metastore: Partial<IAdminMetastore>) =>
        ds.update<IAdminMetastore>(
            `/admin/query_metastore/${metastoreId}/`,
            metastore
        ),

    delete: (metastoreId: number) =>
        ds.delete(`/admin/query_metastore/${metastoreId}/`),

    recover: (metastoreId: number) =>
        ds.update<IAdminMetastore>(
            `/admin/query_metastore/${metastoreId}/recover/`
        ),
};
