import type { ContentState } from 'draft-js';
import { isEqual } from 'lodash';
import { normalize, schema } from 'normalizr';
import toast from 'react-hot-toast';

import {
    DataTableWarningSeverity,
    IDataColumn,
    IDataSchema,
    IDataTable,
    IDataTableSamples,
    IDataTableWarning,
    IDataTableWarningUpdateFields,
    IFunctionDescription,
    ILineage,
    IPaginatedQuerySampleFilters,
    IQueryMetastore,
    ITableQueryEngine,
    ITableSampleParams,
    ITopQueryConcurrences,
    ITopQueryUser,
    IUpdateTableParams,
} from 'const/metastore';
import { convertRawToContentState } from 'lib/richtext/serialize';
import {
    QueryMetastoreResource,
    TableColumnResource,
    TableLineageResource,
    TableOwnershipResource,
    TableQueryExampleResource,
    TableResource,
    TableSamplesResource,
    TableStatsResource,
    TableWarningResource,
} from 'resource/table';
import { FunctionDocumentationResource } from 'resource/utils/functionDocumentation';

import {
    IReceiveChildDataLineageAction,
    IReceiveDataJobMetadataAction,
    IReceiveDataTableAction,
    IReceiveDataTableSamplesAction,
    IReceiveDataTableSamplesPollingAction,
    IReceiveParentDataLineageAction,
    IReceiveQueryExampleIdsAction,
    IRemoveDataTableAction,
    ThunkResult,
} from './types';

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
        const { data } = await QueryMetastoreResource.getAll(
            getState().environment.currentEnvironmentId
        );

        dispatch({
            type: '@@dataSources/RECEIVE_QUERY_METASTORES',
            payload: {
                queryMetastores: data,
            },
        });

        return data;
    };
}

function receiveRawDataTable(rawTable: IDataTable) {
    const normalizedData = normalize(rawTable, dataTableSchema);
    const {
        dataSchema = {},
        dataTable = {},
        dataColumn = {},
        dataTableWarning = {},
    } = normalizedData.entities;

    return receiveDataTable(
        dataSchema,
        dataTable,
        dataColumn,
        dataTableWarning
    );
}

export function fetchDataTable(tableId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await TableResource.get(tableId);
        dispatch(receiveRawDataTable(data));
    };
}

export function fetchDataTableIfNeeded(
    tableId: number
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

export function refreshDataTableInMetastore(
    tableId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data } = await TableResource.refresh(tableId);
        if (!data) {
            dispatch(removeDataTable(tableId));
        } else {
            dispatch(receiveRawDataTable(data));
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
            const { data } = await TableResource.getByName(
                metastoreId,
                schemaName,
                tableName
            );

            if (!data) {
                return null;
            }

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
    params: IUpdateTableParams
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            const { data } = await TableResource.update(tableId, params);
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
        try {
            const { data } = await TableColumnResource.update(
                columnId,
                description
            );

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
                    const { description: rawDescription } =
                        column as IDataColumn;

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

export function removeDataTable(tableId: number): IRemoveDataTableAction {
    return {
        type: '@@dataSources/REMOVE_DATA_TABLE',
        payload: {
            dataTableId: tableId,
        },
    };
}

export function fetchDataLineage(tableId: number): ThunkResult<Promise<any[]>> {
    return (dispatch, getState) => {
        const promiseArr = [];
        const cState =
            getState().dataSources.dataLineages.childLineage[tableId];
        if (!cState) {
            promiseArr.push(dispatch(fetchChildDataLineage(tableId)));
        }
        const pState =
            getState().dataSources.dataLineages.parentLineage[tableId];
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
        const state =
            getState().dataSources.dataLineages.parentLineage[tableId];
        if (!state) {
            const { data } = await TableLineageResource.getParents(tableId);
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

export function fetchChildDataLineage(
    tableId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState().dataSources.dataLineages.childLineage[tableId];
        if (!state) {
            const { data } = await TableLineageResource.getChildren(tableId);
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
            const { data } = await TableSamplesResource.get(
                tableId,
                getState().environment.currentEnvironmentId
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
            const { data: taskId } = await TableSamplesResource.create(
                tableId,
                getState().environment.currentEnvironmentId,
                engineId,
                sampleParams
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
    let finished = false;
    let failed = null;
    let progress = 0;

    return async (dispatch, getState) => {
        try {
            const poll =
                getState().dataSources.dataTablesSamplesPollingById[tableId];
            if (poll) {
                const { data } = await TableSamplesResource.poll(
                    tableId,
                    poll.taskId
                );

                if (!data) {
                    finished = true;
                    failed = 'Failed due to unknown reasons';
                } else {
                    [finished, failed, progress] = data;
                }

                dispatch(
                    receiveDataTableSamplesPolling(
                        tableId,
                        poll.taskId,
                        progress,
                        finished
                    )
                );

                if (failed) {
                    toast.error(
                        'Failed to run sample query. reason: ' + failed
                    );
                }

                if (finished && !failed) {
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
    filters: IPaginatedQuerySampleFilters,
    offset: number = 0,
    limit: number = QUERY_EXAMPLE_BATCH_SIZE
): ThunkResult<Promise<number[]>> {
    return async (dispatch, getState) => {
        try {
            const { data } = await TableQueryExampleResource.get(
                tableId,
                getState().environment.currentEnvironmentId,
                filters,
                limit,
                offset
            );
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
    filters: IPaginatedQuerySampleFilters
): ThunkResult<Promise<number[]>> {
    return (dispatch, getState) => {
        const state = getState();
        const samples = state.dataSources.queryExampleIdsById[tableId];
        const prevFilters =
            state.dataSources.queryExampleIdsById[tableId]?.filters;

        if (!samples || !isEqual(filters, prevFilters)) {
            return dispatch(fetchQueryExampleIds(tableId, filters));
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
        const filters =
            state.dataSources.queryExampleIdsById[tableId]?.filters ?? {};

        return dispatch(
            fetchQueryExampleIds(
                tableId,
                filters,
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

            const { data } = await TableQueryExampleResource.getTopUsers(
                tableId,
                state.environment.currentEnvironmentId,
                limit
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

export function fetchTableQueryEnginesIfNeeded(
    tableId: number
): ThunkResult<Promise<ITableQueryEngine[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const engines = state.dataSources.queryEnginesByTableId[tableId];
            if (engines != null) {
                return Promise.resolve(engines);
            }

            const { data } = await TableQueryExampleResource.getEngines(
                tableId,
                state.environment.currentEnvironmentId
            );
            dispatch({
                type: '@@dataSources/RECEIVE_TABLE_QUERY_ENGINES',
                payload: {
                    tableId,
                    engines: data,
                },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchTopQueryConcurrencesIfNeeded(
    tableId: number,
    limit = 5
): ThunkResult<Promise<ITopQueryConcurrences[]>> {
    return async (dispatch, getState) => {
        try {
            const state = getState();
            const joins =
                state.dataSources.queryTopConcurrencesByTableId[tableId];
            if (joins != null) {
                return Promise.resolve(joins);
            }

            const { data } = await TableQueryExampleResource.getTopConcurrences(
                tableId,
                limit
            );
            dispatch({
                type: '@@dataSources/RECEIVE_TOP_QUERY_CONCURRENCES',
                payload: {
                    tableId,
                    joins: data,
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
        return TableLineageResource.getJobMetadata(dataJobMetadataId).then(
            (resp) => {
                dispatch(receiveDataJobMetadata(resp.data));
            }
        );
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
        if (
            language in state.dataSources.functionDocumentation.byNameByLanguage
        ) {
            return state.dataSources.functionDocumentation.byNameByLanguage[
                language
            ];
        }

        const functionDocumentationPromise =
            state.dataSources.functionDocumentation.loading[language];
        if (functionDocumentationPromise == null) {
            try {
                const fetchPromise =
                    FunctionDocumentationResource.getByLanguage(language);
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
                    {} as Record<string, IFunctionDescription[]>
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
        } else if (functionDocumentationPromise instanceof Promise) {
            return functionDocumentationPromise;
        }
    };
}

export function updateTableWarnings(
    warningId: number,
    fields: IDataTableWarningUpdateFields
): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await TableWarningResource.update(warningId, fields);
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
): ThunkResult<Promise<IDataTableWarning>> {
    return async (dispatch) => {
        const { data } = await TableWarningResource.create(
            tableId,
            message,
            severity
        );
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
            await TableWarningResource.delete(warning.id);
            dispatch({
                type: '@@dataSources/REMOVE_DATA_TABLE_WARNING',
                payload: warning,
            });
        }
    };
}

function fetchDataTableOwnership(tableId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await TableOwnershipResource.get(tableId);
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
            const { data } = await TableOwnershipResource.create(tableId);
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
            await TableOwnershipResource.delete(tableId);
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
            const { data: stat } = await TableStatsResource.get(tableId);
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
