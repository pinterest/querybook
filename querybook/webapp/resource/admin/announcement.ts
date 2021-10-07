import { IAdminAnnouncement } from 'const/admin';
import ds from 'lib/datasource';

export const AdminAnnouncementResource = {
    getAll: () => ds.fetch<IAdminAnnouncement[]>('/admin/announcement/'),
    create: (message: string, urlRegex: string, canDismiss: boolean) =>
        ds.save<IAdminAnnouncement>(`/admin/announcement/`, {
            message,
            url_regex: urlRegex,
            can_dismiss: canDismiss,
        }),
    update: (id: number, announcement: Partial<IAdminAnnouncement>) =>
        ds.update<IAdminAnnouncement>(
            `/admin/announcement/${id}/`,
            announcement
        ),
    delete: (id: number) => ds.delete(`/admin/announcement/${id}/`),
};
