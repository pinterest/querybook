export type LogItemType =
    | 'announcement'
    | 'query_engine'
    | 'query_metastore'
    | 'admin'
    | 'environment'
    | 'task';

export enum ActionType {
    CREATE = 0,
    UPDATE,
    DELETE,
}
