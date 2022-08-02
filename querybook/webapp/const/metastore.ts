import type { ContentState } from 'draft-js';

export interface IQueryMetastore {
    id: number;
    name: string;
}

export interface IDataSchema {
    id: number;
    datasource_id: number;
    db_comment?: string;
    description?: string;
    name: string;
    table_count: number;
    title?: string;
    metastore_id: number;
}

export interface IDataTable {
    id: number;
    created_at: number;
    updated_at: number;

    name: string;
    type: string;

    owner: string;

    table_created_at: number;
    table_updated_by: string;
    table_updated_at: number;

    data_size_bytes?: number;
    location: string;
    column_count: number;
    column: number[];

    latest_partitions: string;
    earliest_partitions: string;
    description: string | ContentState;
    hive_metastore_description: string;

    schema: number;
    schema_id: number;
    warnings: number[];
    golden: boolean;
}

// Keep it the same as server/const.py
export enum DataTableWarningSeverity {
    WARNING = 0,
    ERROR = 1,
}

export interface IDataTableWarning {
    id: number;
    table_id: number;
    message: string;
    severity: DataTableWarningSeverity;
    created_at: number;
    created_by: number;
    updated_at: number;
    updated_by: number;
}

export interface IDataTableWarningUpdateFields {
    message?: string;
    severity?: DataTableWarningSeverity;
}

export interface IDataTableSamples {
    id: number;
    created_at: number;
    created_by: number;
    value: any[][];
}

export interface IDataTableSamplesPolling {
    taskId: number;
    progress: number;
}

export interface IDataColumn {
    id: number;
    comment?: string;
    description: string | ContentState;
    name: string;
    table_id: number;
    type: string;
}

export interface ILineage {
    job_metadata_id: number;
    parent_table_id: number;
    parent_name: string;
    table_id: number;
    table_name: string;
}

export interface ILineageCollection {
    childLineage: Record<number, ILineage[]>;
    parentLineage: Record<number, ILineage[]>;
}

export interface IDataJobMetadata {
    id: number;
    job_name: string;
    job_info: Record<string, string>;
    job_owner: string;
    query_text: string;
    is_adhoc: boolean;
}

export interface IFunctionDescription {
    description: string;
    id: number;
    language: string;
    name: string;
    params: string;
    return_type: string;
}

export type FunctionDocumentationCollection = Record<
    string,
    Record<string, IFunctionDescription[]>
>;

export interface IPaginatedQuerySampleFilters {
    uid?: number;
    engine_id?: number;
    with_table_id?: number;
}

export interface IPaginatedQuerySamples {
    hasMore: boolean;
    queryIds: number[];
    filters: IPaginatedQuerySampleFilters;
}

export interface ITopQueryUser {
    uid: number;
    count: number;
}

export interface ITableQueryEngine {
    engine_id: number;
    count: number;
}

export interface ITopQueryConcurrences {
    table_id: number;
    count: number;
}

export interface IDataTableOwnership {
    data_table_id: number;
    uid: number;
    created_at: number;
}

export type TableStatValue = number | string | Array<number | string>;
export interface ITableStats {
    id: number;
    table_id: number;
    key: string;
    value: TableStatValue;
    uid: number;
}

export interface ITableSampleParams {
    partition?: string;
    where?: Array<[string, string, string]>;
    order_by?: string;
    order_by_asc?: boolean;
    limit?: number;
}

export interface IUpdateTableParams {
    description?: ContentState;
    golden?: boolean;
}

export interface ITableColumnStats {
    id: number;
    column_id: number;
    key: string;
    value: TableStatValue;
    uid: number;
}

export type SchemaSortKey = 'name' | 'table_count';
export type SchemaTableSortKey = 'name' | 'importance_score';
export const tableNameDraggableType = 'TableName-';
export const tableNameDataTransferName = 'tableName';
