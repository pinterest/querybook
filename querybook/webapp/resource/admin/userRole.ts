import { IAdminUserRole } from 'const/admin';
import ds from 'lib/datasource';

export const UserRoleResource = {
    getAll: () => ds.fetch<IAdminUserRole[]>('/admin/user_role/'),
    delete: (userRoleId: number) =>
        ds.delete(`/admin/user_role/${userRoleId}/`),

    create: (uid: number, role: string) =>
        ds.save<IAdminUserRole>(`/admin/user_role/`, {
            uid,
            role,
        }),
};
