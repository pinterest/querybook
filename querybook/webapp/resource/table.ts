import type { ContentState } from 'draft-js';
import JSONBig from 'json-bigint';

import type {
    DataTableWarningSeverity,
    IDataColumn,
    IDataJobMetadata,
    IDataTable,
    IDataTableOwnership,
    IDataTableSamples,
    IDataTableWarning,
    IDataTableWarningUpdateFields,
    IDetailedDataColumn,
    ILineage,
    IPaginatedQuerySampleFilters,
    IQueryMetastore,
    ITableQueryEngine,
    ITableSampleParams,
    ITableStats,
    ITopQueryConcurrences,
    ITopQueryUser,
    IUpdateTableParams,
    MetadataType,
} from 'const/metastore';
import type { ITag } from 'const/tag';
import ds from 'lib/datasource';
import { convertContentStateToHTML } from 'lib/richtext/serialize';

export const TableSamplesResource = {
    getQuery: (tableId: number, sampleParams: ITableSampleParams) =>
        ds.fetch<string>(
            `/table/${tableId}/raw_samples_query/`,
            sampleParams as Record<string, any>
        ),

    get: (tableId: number, environmentId: number) =>
        ds.fetch<IDataTableSamples>(
            {
                url: `/table/${tableId}/samples/`,
                transformResponse: [(data) => JSONBig.parse(data)],
            },
            {
                environment_id: environmentId,
            }
        ),

    create: (
        tableId: number,
        environmentId: number,
        engineId: number,
        sampleParams: ITableSampleParams
    ) =>
        ds.save<number>(
            {
                url: `/table/${tableId}/samples/`,
                transformResponse: [(data) => JSONBig.parse(data)],
            },
            {
                environment_id: environmentId,
                engine_id: engineId,
                ...sampleParams,
            }
        ),

    poll: (tableId: number, taskId: number) =>
        ds.fetch<[finished: boolean, failed: string | null, progress: number]>(
            `/table/${tableId}/samples/poll/`,
            {
                task_id: taskId,
            }
        ),
};

export const TableQueryExampleResource = {
    get: (
        tableId: number,
        environmentId: number,
        filters: IPaginatedQuerySampleFilters,
        limit: number,
        offset: number
    ) =>
        ds.fetch<number[]>(
            {
                url: `/table/${tableId}/query_examples/`,
            },
            {
                table_id: tableId,
                environment_id: environmentId,
                ...filters,
                limit,
                offset,
            }
        ),

    getTopUsers: (tableId: number, environmentId: number, limit: number) =>
        ds.fetch<ITopQueryUser[]>(`/table/${tableId}/query_examples/users/`, {
            table_id: tableId,
            environment_id: environmentId,
            limit,
        }),

    getEngines: (tableId: number, environmentId: number) =>
        ds.fetch<ITableQueryEngine[]>(
            `/table/${tableId}/query_examples/engines/`,
            {
                table_id: tableId,
                environment_id: environmentId,
            }
        ),

    getTopConcurrences: (tableId: number, limit: number) =>
        ds.fetch<ITopQueryConcurrences[]>(
            `/table/${tableId}/query_examples/concurrences/`,
            {
                table_id: tableId,
                limit,
            }
        ),
};

export const QueryMetastoreResource = {
    getAll: (environmentId: number) =>
        ds.fetch<IQueryMetastore[]>('/query_metastore/', {
            environment_id: environmentId,
        }),
};

export const TableResource = {
    get: (tableId: number) => ds.fetch<IDataTable>(`/table/${tableId}/`),
    getByName: (metastoreId: number, schemaName: string, tableName: string) =>
        ds.fetch<IDataTable>(`/table_name/${schemaName}/${tableName}/`, {
            metastore_id: metastoreId,
        }),
    getColumnDetails: (tableId: number) =>
        ds.fetch<IDetailedDataColumn[]>(`/table/${tableId}/detailed_column/`),

    getMetastoreLink: (tableId: number, metadataType: MetadataType) =>
        ds.fetch<string>(`/table/${tableId}/metastore_link/`, {
            metadata_type: metadataType,
        }),

    checkIfExists: (
        metastoreId: number,
        schemaName: string,
        tableName: string
    ) =>
        ds.fetch<[schemaExists: boolean, tableExists: boolean]>(
            `/table_name/${schemaName}/${tableName}/exists/`,
            {
                metastore_id: metastoreId,
            }
        ),

    update: (tableId: number, updatedParams: IUpdateTableParams) => {
        const params: Partial<IDataTable> = {};
        if (updatedParams.description != null) {
            params.description = convertContentStateToHTML(
                updatedParams.description
            );
        }
        if (updatedParams.golden != null) {
            params.golden = updatedParams.golden;
        }

        return ds.update<IDataTable>(`/table/${tableId}/`, params);
    },

    refresh: (tableId: number) =>
        ds.update<IDataTable>(`/table/${tableId}/refresh/`),
};

export const TableColumnResource = {
    get: (columnId: number) =>
        ds.fetch<IDetailedDataColumn>(`/column/${columnId}/`),

    update: (columnId: number, description: ContentState) => {
        const params = {
            description: convertContentStateToHTML(description),
        };

        return ds.update<IDataColumn>(`/column/${columnId}/`, params);
    },
    getTags: (columnId: number) => ds.fetch<ITag[]>(`/column/${columnId}/tag/`),
};

export const TableLineageResource = {
    getParents: (tableId: number) =>
        ds.fetch<ILineage[]>(`/lineage/${tableId}/parent/`),
    getChildren: (tableId: number) =>
        ds.fetch<ILineage[]>(`/lineage/${tableId}/child/`),

    getJobMetadata: (dataJobMetadataId: number) =>
        ds.fetch<IDataJobMetadata>(`/data_job_metadata/${dataJobMetadataId}/`),
};

export const TableWarningResource = {
    update: (warningId: number, fields: IDataTableWarningUpdateFields) =>
        ds.update<IDataTableWarning>(
            `/table_warning/${warningId}/`,
            fields as Record<string, unknown>
        ),

    create: (
        tableId: number,
        message: string,
        severity: DataTableWarningSeverity
    ) =>
        ds.save<IDataTableWarning>('/table_warning/', {
            table_id: tableId,
            message,
            severity,
        }),

    delete: (warningId: number) => ds.delete(`/table_warning/${warningId}/`),
};

export const TableOwnershipResource = {
    get: (tableId: number) =>
        ds.fetch<IDataTableOwnership[]>(`/table/${tableId}/ownership/`),
    create: (tableId: number) =>
        ds.save<IDataTableOwnership>(`/table/${tableId}/ownership/`),
    delete: (tableId: number) => ds.delete(`/table/${tableId}/ownership/`),
};

export const TableStatsResource = {
    get: (tableId: number) =>
        ds.fetch<ITableStats[]>(`/table/stats/${tableId}/`),
};

export const TableTagResource = {
    get: (tableId: number) => ds.fetch<ITag[]>(`/table/${tableId}/tag/`),
    search: (keyword: string) =>
        ds.fetch<string[]>(`/tag/keyword/`, { keyword }),
    create: (tableId: number, tag: string) =>
        ds.save<ITag>(`/table/${tableId}/tag/`, { tag }),
    delete: (tableId: number, tagName: string) =>
        ds.delete(`/table/${tableId}/tag/`, { tag_name: tagName }),
    update: (tag: ITag) =>
        ds.update<ITag>(`/tag/${tag.id}/`, {
            meta: tag.meta,
        }),
};

export const DataElementResource = {
    search: (keyword: string) =>
        ds.fetch<
            Array<{
                name: string;
                desc: string;
            }>
        >(`/data_element/keyword/`, { keyword }),

    getMetastoreLink: (dataElementId: number) =>
        ds.fetch<string>(`/data_element/${dataElementId}/metastore_link/`),
};
