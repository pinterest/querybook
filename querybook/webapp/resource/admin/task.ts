import { ITaskSchedule } from 'const/schedule';
import ds from 'lib/datasource';

export const AdminTaskResource = {
    getAll: () => ds.fetch<ITaskSchedule[]>('/schedule/'),

    toggleEnabled: (taskId: number, enabled: boolean) =>
        ds.update<ITaskSchedule>(`/schedule/${taskId}/`, {
            enabled,
        }),
};
