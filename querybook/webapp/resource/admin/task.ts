import { ITaskSchedule } from 'const/schedule';
import ds from 'lib/datasource';

export function getTasks() {
    return ds.fetch<ITaskSchedule[]>('/schedule/');
}

export function toggleTaskEnabled(taskId: number, enabled: boolean) {
    return ds.update<ITaskSchedule>(`/schedule/${taskId}/`, {
        enabled,
    });
}
