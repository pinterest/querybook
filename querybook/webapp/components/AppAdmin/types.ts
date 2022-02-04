export const adminEntityToTitle = {
    environment: 'Environment',
    metastore: 'Metastore',
    query_engine: 'Query Engine',
    task: 'Task',
    task_status: 'Task Status',
    user_role: 'User Role',
    api_access_token: 'API Access Token',
    announcement: 'Announcement',
    config: 'Configuration',
};

export type AdminEntity =
    | 'environment'
    | 'metastore'
    | 'query_engine'
    | 'task'
    | 'task_status'
    | 'user_role'
    | 'api_access_token'
    | 'announcement'
    | 'config';

export interface IAdminEntity {
    id: number;
    name: string;
    deleted: boolean;
    searchField?: string;
}
