export const adminEntityToTitle = {
    environment: 'Environment',
    metastore: 'Metastore',
    query_engine: 'Query Engine',
    job_status: 'Job Status',
    user_role: 'User Role',
    api_access_token: 'API Access Token',
    announcement: 'Announcement',
};

export type AdminEntity =
    | 'environment'
    | 'metastore'
    | 'query_engine'
    | 'job_status'
    | 'user_role'
    | 'api_access_token'
    | 'announcement';

export interface IAdminEntity {
    id: number;
    name: string;
    deleted: boolean;
    searchField?: string;
}
