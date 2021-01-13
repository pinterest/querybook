import { normalize, schema } from 'normalizr';
import type { ContentState } from 'draft-js';
import JSONBig from 'json-bigint';

import {
    IDataTable,
    IDataColumn,
    ILineage,
    IQueryMetastore,
    IDataTableSamples,
    IDataSchema,
    IDataTableWarning,
    DataTableWarningSeverity,
    ITopQueryUser,
    IPaginatedQuerySampleFilters,
    IDataTableOwnership,
    ITableStats,
} from 'const/metastore';
import {
    convertContentStateToHTML,
    convertRawToContentState,
} from 'lib/richtext/serialize';
import ds from 'lib/datasource';
import {
    IReceiveDataTableAction,
    ThunkResult,
    IReceiveDataTableSamplesAction,
    IReceiveDataTableSamplesPollingAction,
    IReceiveDataJobMetadataAction,
    IReceiveParentDataLineageAction,
    IReceiveChildDataLineageAction,
    IReceiveQueryExampleIdsAction,
    ITableSampleParams,
} from './types';

interface IUpdateTableParams {
    description: ContentState;
    golden: boolean;
}

const dataTableColumnSchema = new schema.Entity(
    'dataColumn',
    {},
    {
        processStrategy: (value, parent) =>
            parent
                ? {
                      ...value,
                      table: parent.id,
                  }
                : value,
    }
);
const dataSchemaSchema = new schema.Entity('dataSchema');
const dataTableWarningSchema = new schema.Entity('dataTableWarning');

const dataTableSchema = new schema.Entity('dataTable', {
    column: [dataTableColumnSchema],
    schema: dataSchemaSchema,
    warnings: [dataTableWarningSchema],
});

export function fetchQueryMetastore(): ThunkResult<Promise<IQueryMetastore[]>> {
    return async (dispatch, getState) => {
        const {
            data,
        }: {
            data: IQueryMetastore[];
        } = await ds.fetch('/query_metastore/', {
            environment_id: getState().environment.currentEnvironmentId,
        });

        dispatch({
            type: '@@dataSources/RECEIVE_QUERY_METASTORES',
            payload: {
                queryMetastores: data,
            },
        });

        return data;
    };
}

export function fetchDataTable(tableId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await ds.fetch(`/table/${tableId}/`);
        const normalizedData = normalize(data, dataTableSchema);
        const {
            dataSchema = {},
            dataTable = {},
            dataColumn = {},
            dataTableWarning = {},
        } = normalizedData.entities;

        dispatch(
            receiveDataTable(
                dataSchema,
                dataTable,
                dataColumn,
                dataTableWarning
            )
        );
    };
}

export function fetchDataTableIfNeeded(
    tableId
): ThunkResult<Promise<IDataTable>> {
    return (dispatch, getState) => {
        if (tableId) {
            const state = getState();
            const table = state.dataSources.dataTablesById[tableId];
            if (!table || table.schema == null || table.column == null) {
                return dispatch(fetchDataTable(tableId));
            } else {
                return Promise.resolve(table);
            }
        }
    };
}

export function fetchDataTableByName(
    schemaName: string,
    tableName: string,
    metastoreId: number
): ThunkResult<Promise<IDataTable>> {
    return async (dispatch) => {
        try {
            const { data } = await ds.fetch(
                `/table_name/${schemaName}/${tableName}/`,
                {
                    metastore_id: metastoreId,
                }
            );

            const normalizedData = normalize(data, dataTableSchema);
            const {
                dataSchema = {},
                dataTable = {},
                dataColumn = {},
                dataTableWarning = {},
            } = normalizedData.entities;
            dispatch(
                receiveDataTable(
                    dataSchema,
                    dataTable,
                    dataColumn,
                    dataTableWarning
                )
            );
            return data;
        } catch (e) {
            return null;
        }
    };
}

export function fetchDataTableByNameIfNeeded(
    schemaName: string,
    tableName: string,
    metastoreId: number
): ThunkResult<Promise<IDataTable>> {
    return async (dispatch, getState) => {
        const fullName = `${schemaName}.${tableName}`;
        const state = getState();
        const tableId = (state.dataSources.dataTableNameToId[metastoreId] ||
            {})[fullName];
        if (tableId) {
            const table = state.dataSources.dataTablesById[tableId];
            if (table) {
                return table;
            }
        }
        return dispatch(
            fetchDataTableByName(schemaName, tableName, metastoreId)
        );
    };
}

export function updateDataTable(
    tableId: number,
    { description, golden }: IUpdateTableParams
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const params: Partial<IDataTable> = {};

        if (description != null) {
            params.description = convertContentStateToHTML(description);
        }
        if (golden != null) {
            params.golden = golden;
        }

        try {
            const { data } = await ds.update(`/table/${tableId}/`, params);

            const normalizedData = normalize(data, dataTableSchema);
            const { dataTable = {}, dataColumn = {} } = normalizedData.entities;

            dispatch(receiveDataTable({}, dataTable, dataColumn, {}));
        } catch (error) {
            // dispatch({
            //     type: 'ERROR',
            //     error,
            // });
        }
    };
}

export function updateDataColumnDescription(
    columnId: number,
    description: ContentState
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const params = {
            description: convertContentStateToHTML(description),
        };
        try {
            const { data } = await ds.update(`/column/${columnId}/`, params);

            const normalizedData = normalize(data, dataTableColumnSchema);
            const { dataColumn = {} } = normalizedData.entities;
            dispatch(receiveDataTable({}, {}, dataColumn, {}));
        } catch (error) {
            // dispatch({
            //     type: 'ERROR',
            //     error,
            // });
        }
    };
}

export function receiveDataTable(
    dataSchema: Record<number, IDataSchema>,
    dataTable: Record<number, IDataTable>,
    dataColumn: Record<number, IDataColumn>,
    dataTableWarning: Record<number, IDataTableWarning>
): IReceiveDataTableAction {
    return {
        type: '@@dataSources/RECEIVE_DATA_TABLE',
        payload: {
            dataTablesById: Object.entries(dataTable).reduce(
                (hash, [id, table]) => {
                    const { description: rawDescription } = table;

                    const description = convertRawToContentState(
                        rawDescription as string
                    );

                    hash[id] = {
                        ...table,
                        description,
                    };

                    return hash;
                },
                {}
            ),
            dataColumnsById: Object.entries(dataColumn).reduce(
                (hash, [id, column]) => {
                    const {
                        description: rawDescription,
                    } = column as IDataColumn;

                    const description = convertRawToContentState(
                        rawDescription as string
                    );

                    hash[id] = {
                        ...column,
                        description,
                    };

                    return hash;
                },
                {}
            ),
            dataSchemasById: dataSchema,
            dataTableWarningById: dataTableWarning,
        },
    };
}

export function fetchDataLineage(tableId): ThunkResult<Promise<any[]>> {
    return (dispatch, getState) => {
        const promiseArr = [];
        const cState = getState().dataSources.dataLineages.childLineage[
            tableId
        ];
        if (!cState) {
            promiseArr.push(dispatch(fetchChildDataLineage(tableId)));
        }
        const pState = getState().dataSources.dataLineages.parentLineage[
            tableId
        ];
        if (!pState) {
            promiseArr.push(dispatch(fetchParentDataLineage(tableId)));
        }
        return Promise.all(promiseArr);
    };
}

export function fetchParentDataLineage(
    tableId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState().dataSources.dataLineages.parentLineage[
            tableId
        ];
        if (!state) {
            const { data } = await ds.fetch(`/lineage/${tableId}/parent/`);
            dispatch(receiveParentDataLineage(data, tableId));
        }
    };
}

function receiveParentDataLineage(
    lineages: ILineage[],
    tableId: number
): IReceiveParentDataLineageAction {
    return {
        type: '@@dataSources/RECEIVE_PARENT_DATA_LINEAGE',
        payload: {
            lineages,
            tableId,
        },
    };
}

export function fetchChildDataLineage(tableId): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState().dataSources.dataLineages.childLineage[tableId];
        if (!state) {
            const { data } = await ds.fetch(`/lineage/${tableId}/child/`);
            dispatch(receiveChildDataLineage(data, tableId));
        }
    };
}

function receiveChildDataLineage(
    lineages: ILineage[],
    tableId: number
): IReceiveChildDataLineageAction {
    return {
        type: '@@dataSources/RECEIVE_CHILD_DATA_LINEAGE',
        payload: {
            lineages,
            tableId,
        },
    };
}

function receiveDataTableSamples(
    tableId: number,
    samples: IDataTableSamples
): IReceiveDataTableSamplesAction {
    return {
        type: '@@dataSources/RECEIVE_DATA_TABLE_SAMPLES',
        payload: {
            tableId,
            samples,
        },
    };
}

function receiveDataTableSamplesPolling(
    tableId: number,
    taskId: number,
    progress: number = 0,
    finished: boolean = false
): IReceiveDataTableSamplesPollingAction {
    return {
        type: '@@dataSources/RECEIVE_DATA_TABLE_SAMPLES_POLLING',
        payload: {
            tableId,
            taskId,
            progress,
            finished,
        },
    };
}

export function fetchDataTableSamples(
    tableId: number
): ThunkResult<Promise<IDataTableSamples>> {
    return async (dispatch, getState) => {
        try {
            const environmentId = getState().environment.currentEnvironmentId;
            const { data } = await ds.fetch(
                {
                    url: `/table/${tableId}/samples/`,
                    transformResponse: [JSONBig.parse],
                },
                {
                    environment_id: environmentId,
                }
            );
            dispatch(receiveDataTableSamples(tableId, data));
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchDataTableSamplesIfNeeded(
    tableId: number
): ThunkResult<Promise<IDataTableSamples>> {
    return (dispatch, getState) => {
        const state = getState();
        const samples = state.dataSources.dataTablesSamplesById[tableId];
        if (!samples) {
            return dispatch(fetchDataTableSamples(tableId));
        }
    };
}

export function createDataTableSamples(
    tableId: number,
    engineId: number,
    sampleParams: ITableSampleParams = {}
): ThunkResult<Promise<number>> {
    return async (dispatch, getState) => {
        try {
            const environmentId = getState().environment.currentEnvironmentId;
            const { data: taskId } = await ds.save<number>(
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
            dispatch(receiveDataTableSamplesPolling(tableId, taskId));
            return taskId;
        } catch (e) {
            console.error(e);
        }
    };
}

export function pollDataTableSample(
    tableId: number
): ThunkResult<Promise<boolean>> {
    return async (dispatch, getState) => {
        let finished = false;
        try {
            const poll = getState().dataSources.dataTablesSamplesPollingById[
                tableId
            ];
            if (poll) {
                const { data } = await ds.fetch<[boolean, number]>(
                    `/table/${tableId}/samples/poll/`,
                    {
                        task_id: poll.taskId,
                    }
                );

                finished = !data || data[0];
                dispatch(
                    receiveDataTableSamplesPolling(
                        tableId,
                        poll.taskId,
                        data?.[1],
                        finished
                    )
                );

                if (finished) {
                    await dispatch(fetchDataTableSamples(tableId));
                }

                return finished;
            }
        } catch (e) {
            console.error(e);
        }
        return finished;
    };
}

function receiveQueryExampleIds(
    tableId: number,
    exampleIds: number[],
    hasMore: boolean,
    filters: IPaginatedQuerySampleFilters
): IReceiveQueryExampleIdsAction {
    return {
        type: '@@dataSources/RECEIVE_QUERY_EXAMPLES',
        payload: {
            tableId,
            exampleIds,
            hasMore,
            filters,
        },
    };
}

const QUERY_EXAMPLE_BATCH_SIZE = 5;

export function fetchQueryExampleIds(
    tableId: number,
    uid: number = null,
    offset: number = 0,
    limit: number = QUERY_EXAMPLE_BATCH_SIZE
): ThunkResult<Promise<number[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const environmentId = state.environment.currentEnvironmentId;
            const { data } = await ds.fetch<[]>(
                {
                    url: `/table/${tableId}/query_examples/`,
                },
                {
                    table_id: tableId,
                    environment_id: environmentId,
                    uid,
                    limit,
                    offset,
                }
            );
            const filters = uid ? { uid } : {};
            dispatch(
                receiveQueryExampleIds(
                    tableId,
                    data,
                    data?.length === limit,
                    filters
                )
            );
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchQueryExampleIdsIfNeeded(
    tableId: number,
    uid: number = null
): ThunkResult<Promise<number[]>> {
    return (dispatch, getState) => {
        const state = getState();
        const samples = state.dataSources.queryExampleIdsById[tableId];
        const prevUidFilter =
            state.dataSources.queryExampleIdsById[tableId]?.filters.uid || null;

        if (!samples || uid !== prevUidFilter) {
            return dispatch(fetchQueryExampleIds(tableId, uid));
        } else {
            return Promise.resolve(samples.queryIds);
        }
    };
}

export function fetchMoreQueryExampleIds(
    tableId: number
): ThunkResult<Promise<number[]>> {
    return (dispatch, getState) => {
        const state = getState();
        const samples = state.dataSources.queryExampleIdsById[tableId];
        const uidFilter =
            state.dataSources.queryExampleIdsById[tableId]?.filters.uid || null;

        return dispatch(
            fetchQueryExampleIds(
                tableId,
                uidFilter,
                samples?.queryIds?.length ?? 0
            )
        );
    };
}

export function fetchTopQueryUsersIfNeeded(
    tableId: number,
    limit = 5
): ThunkResult<Promise<ITopQueryUser[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const users = state.dataSources.queryTopUsersByTableId[tableId];
            if (users != null) {
                return Promise.resolve(users);
            }

            const environmentId = state.environment.currentEnvironmentId;
            const { data } = await ds.fetch<ITopQueryUser[]>(
                {
                    url: `/table/${tableId}/query_example_users/`,
                },
                {
                    table_id: tableId,
                    environment_id: environmentId,
                    limit,
                }
            );
            dispatch({
                type: '@@dataSources/RECEIVE_TOP_QUERY_USERS',
                payload: {
                    tableId,
                    users: data,
                },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

function receiveDataJobMetadata(
    dataJobMetadata
): IReceiveDataJobMetadataAction {
    return {
        type: '@@dataSources/RECEIVE_DATA_JOB_METADATA',
        payload: {
            dataJobMetadata,
        },
    };
}

export function fetchDataJobMetadata(
    dataJobMetadataId: number
): ThunkResult<Promise<void>> {
    return (dispatch) => {
        dispatch(
            receiveDataJobMetadata({
                id: dataJobMetadataId,
                __loading: true,
            })
        );
        return ds
            .fetch(`/data_job_metadata/${dataJobMetadataId}/`)
            .then((resp) => {
                dispatch(receiveDataJobMetadata(resp.data));
            });
    };
}

export function fetchDataJobMetadataIfNeeded(
    dataJobMetadataId: number
): ThunkResult<Promise<void>> {
    return (dispatch, getState) => {
        const state = getState();
        const metadata =
            state.dataSources.dataJobMetadataById[dataJobMetadataId];
        if (!metadata) {
            return dispatch(fetchDataJobMetadata(dataJobMetadataId));
        }
    };
}

export function fetchFunctionDocumentationIfNeeded(
    language: string
): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const state = getState();
        const functionDocumentation =
            state.dataSources.functionDocumentationByNameByLanguage[language];
        if (functionDocumentation == null) {
            try {
                const fetchPromise = ds.fetch(
                    `/function_documentation_language/${language}/`
                );
                dispatch({
                    type: '@@dataSources/LOADING_FUNCTION_DOCUMENTATION',
                    payload: {
                        language,
                        promise: fetchPromise,
                    },
                });

                const resp = await fetchPromise;
                const { data } = resp;

                const functionDocumentationByName = data.reduce(
                    (hash, functionDef) => {
                        const { name } = functionDef;

                        if (name in hash) {
                            hash[name].push(functionDef);
                        } else {
                            hash[name] = [functionDef];
                        }

                        return hash;
                    },
                    {}
                );

                dispatch({
                    type: '@@dataSources/RECEIVE_FUNCTION_DOCUMENTATION',
                    payload: {
                        language,
                        functionDocumentationByName,
                    },
                });

                return resp;
            } catch (e) {
                console.error(e);
            }
        } else if (functionDocumentation instanceof Promise) {
            return functionDocumentation;
        } else {
            return functionDocumentation;
        }
    };
}

export function updateTableWarnings(
    warningId: number,
    fields: Partial<{
        message: string;
        severity: DataTableWarningSeverity;
    }>
): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await ds.update(
            `/table_warning/${warningId}/`,
            fields
        );
        dispatch({
            type: '@@dataSources/RECEIVE_DATA_TABLE_WARNING',
            payload: data,
        });
        return data;
    };
}

export function createTableWarnings(
    tableId: number,
    message: string,
    severity: DataTableWarningSeverity
): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await ds.save('/table_warning/', {
            table_id: tableId,
            message,
            severity,
        });
        dispatch({
            type: '@@dataSources/RECEIVE_DATA_TABLE_WARNING',
            payload: data,
        });
        return data;
    };
}

export function deleteTableWarnings(
    warningId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const warning = getState().dataSources.dataTableWarningById[warningId];
        if (warning) {
            await ds.delete(`/table_warning/${warning.id}/`);
            dispatch({
                type: '@@dataSources/REMOVE_DATA_TABLE_WARNING',
                payload: warning,
            });
        }
    };
}

function fetchDataTableOwnership(tableId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await ds.fetch<IDataTableOwnership[]>(
            `/table/${tableId}/ownership/`,
            {}
        );
        dispatch({
            type: '@@dataSources/RECEIVE_DATA_TABLE_OWNERSHIPS',
            payload: { tableId, ownerships: data },
        });
        return data;
    };
}

export function fetchDataTableOwnershipIfNeeded(
    tableId: number
): ThunkResult<Promise<void>> {
    return (dispatch, getState) => {
        const state = getState();
        const ownership =
            state.dataSources.dataTableOwnershipByTableId[tableId];
        if (!ownership) {
            return dispatch(fetchDataTableOwnership(tableId));
        }
    };
}

export function createDataTableOwnership(
    tableId: number
): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        try {
            const { data } = await ds.save<IDataTableOwnership>(
                `/table/${tableId}/ownership/`
            );
            dispatch({
                type: '@@dataSources/RECEIVE_DATA_TABLE_OWNERSHIP',
                payload: { tableId, ownership: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}
export function deleteDataTableOwnership(
    tableId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        try {
            await ds.delete(`/table/${tableId}/ownership/`);
            dispatch({
                type: '@@dataSources/REMOVE_DATA_TABLE_OWNERSHIP',
                payload: { tableId, uid: getState().user.myUserInfo.uid },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchDataTableStats(
    tableId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            const { data: stat } = await ds.fetch<ITableStats[]>(
                `/table/stats/${tableId}/`
            );
            dispatch({
                type: '@@dataSources/RECEIVE_DATA_TABLE_STATS',
                payload: { tableId, stat },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchDataTableStatsIfNeeded(
    tableId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const stat = getState().dataSources.dataTableStatByTableId[tableId];
        if (!stat) {
            dispatch(fetchDataTableStats(tableId));
        }
    };
}
