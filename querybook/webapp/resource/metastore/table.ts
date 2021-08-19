import {
    IDataTableSamples,
    IPaginatedQuerySampleFilters,
    ITableSampleParams,
    ITopQueryConcurrences,
    ITopQueryUser,
} from 'const/metastore';
import ds from 'lib/datasource';
import JSONBig from 'json-bigint';

export function getTableSamplesQuery(
    tableId: number,
    sampleParams: ITableSampleParams
) {
    return ds.fetch<string>(
        `/table/${tableId}/raw_samples_query/`,
        sampleParams as Record<string, any>
    );
}

export function getTableSamples(tableId: number, environmentId: number) {
    return ds.fetch<IDataTableSamples>(
        {
            url: `/table/${tableId}/samples/`,
            transformResponse: [JSONBig.parse],
        },
        {
            environment_id: environmentId,
        }
    );
}

export function createTableSamples(
    tableId: number,
    environmentId: number,
    engineId: number,
    sampleParams: ITableSampleParams
) {
    return ds.save<number>(
        {
            url: `/table/${tableId}/samples/`,
            transformResponse: [JSONBig.parse],
        },
        {
            environment_id: environmentId,
            engine_id: engineId,
            ...sampleParams,
        }
    );
}

export function pollTableSamples(tableId: number, taskId: number) {
    return ds.fetch<[finished: boolean, progress: number]>(
        `/table/${tableId}/samples/poll/`,
        {
            task_id: taskId,
        }
    );
}

export function getTableQueryExamples(
    tableId: number,
    environmentId: number,
    filters: IPaginatedQuerySampleFilters,
    limit: number,
    offset: number
) {
    return ds.fetch<number[]>(
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
    );
}

export function getTableTopUsers(
    tableId: number,
    environmentId: number,
    limit: number
) {
    return ds.fetch<ITopQueryUser[]>(
        {
            url: `/table/${tableId}/query_examples/users/`,
        },
        {
            table_id: tableId,
            environment_id: environmentId,
            limit,
        }
    );
}

export function getTableTopConcurrences(tableId: number, limit: number) {
    return ds.fetch<ITopQueryConcurrences[]>(
        {
            url: `/table/${tableId}/query_examples/concurrences/`,
        },
        {
            table_id: tableId,
            limit,
        }
    );
}
