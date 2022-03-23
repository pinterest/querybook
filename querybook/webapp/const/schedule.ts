import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

// Keep this the same as the Enum defined in const/schedule.py
export enum TaskRunStatus {
    RUNNING = 0,
    SUCCESS,
    FAILURE,
}

export interface IStatusTypeList {
    [key: number]: {
        class: string;
        iconName: AllLucideIconNames;
        text: string;
    };
}

export const StatusTypes: IStatusTypeList = {
    [TaskRunStatus.RUNNING]: {
        class: 'status-in-progress',
        iconName: 'Loading',
        text: 'In Progress',
    },
    [TaskRunStatus.SUCCESS]: {
        class: 'status-success',
        iconName: 'ThumbsUp',
        text: 'Success',
    },
    [TaskRunStatus.FAILURE]: {
        class: 'status-failure',
        iconName: 'ThumbsDown',
        text: 'Failure',
    },
};

export type TaskType = 'prod' | 'user';

export interface ITaskSchedule {
    id: number;
    name: string;
    task: string;
    task_type: TaskType;
    cron: string;
    args: any[];
    kwargs: Record<string, any>;
    options: Record<string, string | number>;
    last_run_at: number;
    total_run_count: number;
    enabled: boolean;
}

export interface ITaskStatusRecord {
    id: number;
    created_at: number;
    name: string;
    status: TaskRunStatus;
    updated_at: number;
    task_type: TaskType;
    error_message: string | null;
}

export enum NotifyOn {
    ALL = 0,
    ON_FAILURE = 1,
    ON_SUCCESS = 2,
}

export interface IDataDocScheduleKwargs {
    notify_with?: string;
    notify_on?: NotifyOn;
    exports?: Array<{
        exporter_cell_id?: number;
        exporter_name?: string;
        exporter_params?: Record<string, any>;
    }>;
}

export interface IDataDocTaskSchedule extends ITaskSchedule {
    kwargs: IDataDocScheduleKwargs;
}
