import { IChangeLogItem } from 'const/changeLog';
import ds from 'lib/datasource';

export function getChangeLogs(lastViewedDate?: string) {
    const params = {};
    if (lastViewedDate != null) {
        params['last_viewed_date'] = lastViewedDate;
    }
    return ds.fetch<IChangeLogItem[]>(`/utils/change_logs/`, params);
}

export function getChangeLogByDate(changeLogDate: string) {
    return ds.fetch<string>(`/utils/change_log/${changeLogDate}/`);
}
