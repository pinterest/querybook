import moment from 'moment';

import { IAdminAnnouncement } from 'const/admin';
import ds from 'lib/datasource';

function transformSecondsToString(date?: number): string | undefined {
    return date ? moment(date, 'X').format('YYYY-MM-DD') : undefined;
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
            active_from: transformSecondsToString(active_from),
            active_till: transformSecondsToString(active_till),
        }),
    update: (id: number, announcement: Partial<IAdminAnnouncement>) =>
        ds.update<IAdminAnnouncement>(`/admin/announcement/${id}/`, {
            ...announcement,
            active_from: transformSecondsToString(announcement.active_from),
            active_till: transformSecondsToString(announcement.active_till),
        }),
    delete: (id: number) => ds.delete(`/admin/announcement/${id}/`),
};
