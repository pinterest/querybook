import { IChangeLogItem } from 'const/changeLog';
import ds from 'lib/datasource';

export const ChangeLogResource = {
    getAll: (lastViewedDate?: string) => {
        const params = {};
        if (lastViewedDate != null) {
            params['last_viewed_date'] = lastViewedDate;
        }
        return ds.fetch<IChangeLogItem[]>(`/utils/change_logs/`, params);
    },

    getByDate: (changeLogDate: string) =>
        ds.fetch<string>(`/utils/change_log/${changeLogDate}/`),
};
