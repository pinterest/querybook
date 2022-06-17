import { ITaskSchedule, ITaskStatusRecord, TaskType } from 'const/schedule';
import ds from 'lib/datasource';

import { IPaginatedResource } from './types';

export const TaskScheduleResource = {
    getRegisteredTasks: () => ds.fetch<string[]>('/schedule/tasks_list/'),
    getRegisteredTaskParams: () =>
        ds.fetch<{
            [task: string]: {
                [taskParam: string]: string;
            };
        }>('/schedule/tasks_list/params/'),
    getPaginatedRunRecords:
        (
            name: string,
            hideSuccessfulJobs: boolean,
            taskType: TaskType
        ): IPaginatedResource<ITaskStatusRecord> =>
        (limit, offset) =>
            ds.fetch(`/schedule/record/`, {
                limit,
                offset,
                name,
                hide_successful_jobs: hideSuccessfulJobs,
                task_type: taskType,
            }),

    getPaginatedRunRecordsById:
        (
            taskId: number,
            hideSuccessfulJobs: boolean
        ): IPaginatedResource<ITaskStatusRecord> =>
        (limit, offset) =>
            ds.fetch(`/schedule/${taskId}/record/`, {
                limit,
                offset,
                hide_successful_jobs: hideSuccessfulJobs,
            }),

    run: (taskId: number) => ds.save<null>(`/schedule/${taskId}/run/`),
    create: (params: {
        cron: string;
        name: string;
        task: string;
        task_type: 'user' | 'prod';
        enabled: boolean;
        args?: any[];
        kwargs?: Record<any, any>;
        options?: Record<any, any>;
    }) => ds.save<ITaskSchedule>(`/schedule/`, params),

    update: (
        taskId: number,
        params: {
            cron?: string;
            args?: any[];
            kwargs?: Record<any, any>;
            enabled?: boolean;
            options?: Record<any, any>;
        }
    ) => ds.update<ITaskSchedule>(`/schedule/${taskId}/`, params),

    delete: (taskId: number) => ds.delete(`/schedule/${taskId}/`),
};
