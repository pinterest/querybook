import { IAdminUserRole } from 'const/admin';
import ds from 'lib/datasource';

export function getUserRoles() {
    return ds.fetch<IAdminUserRole[]>('/admin/user_role/');
}

export function deleteUserRole(userRoleId: number) {
    return ds.delete(`/admin/user_role/${userRoleId}/`);
}

export function createUserRole(uid: number, role: string) {
    return ds.save<IAdminUserRole>(`/admin/user_role/`, {
        uid,
        role,
    });
}
