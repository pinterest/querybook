// Keep this the same as the Enum defined in const/schedule.py
export enum TaskRunStatus {
    RUNNING = 0,
    SUCCESS,
    FAILURE,
}

export type TaskType = 'prod' | 'user';

export interface ITaskSchedule {
    id: number;
    name: string;
    task: string;
    task_type: TaskType;
    cron: string;
    last_run_at: number;
    enabled: boolean;
}

export interface ITaskStatusRecord {
    id: number;
    alerted: boolean;
    created_at: number;
    name: string;
    status: TaskRunStatus;
    updated_at: number;
    task_type: TaskType;
}
