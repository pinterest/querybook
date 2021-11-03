import { IAdminAnnouncement } from 'const/admin';
import ds from 'lib/datasource';
import moment from 'moment';

function formatDate(date) {
    return date ? moment(date, 'X').utc().format('YYYY-MM-DD') : undefined;
}

export const AdminAnnouncementResource = {
    getAll: () => ds.fetch<IAdminAnnouncement[]>('/admin/announcement/'),
    create: (
        message: string,
        urlRegex: string,
        canDismiss: boolean,
        active_from?: number,
        active_till?: number
    ) =>
        ds.save<IAdminAnnouncement>(`/admin/announcement/`, {
            message,
            url_regex: urlRegex,
            can_dismiss: canDismiss,
            active_from: formatDate(active_from),
            active_till: formatDate(active_till),
        }),
    update: (id: number, announcement: Partial<IAdminAnnouncement>) =>
        ds.update<IAdminAnnouncement>(`/admin/announcement/${id}/`, {
            ...announcement,
            active_from: formatDate(announcement.active_from),
            active_till: formatDate(announcement.active_till),
        }),
    delete: (id: number) => ds.delete(`/admin/announcement/${id}/`),
};
