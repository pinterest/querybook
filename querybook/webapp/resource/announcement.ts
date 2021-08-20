import ds from 'lib/datasource';
import { IAnnouncement } from 'redux/querybookUI/types';

export const AnnouncementResource = {
    getAll: () => ds.fetch<IAnnouncement[]>('/announcement/'),
};
