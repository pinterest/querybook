import { normalize, schema } from 'normalizr';
import { convertToRaw, ContentState } from 'draft-js';
import JSONBig from 'json-bigint';

import {
    IDataTable,
    IDataColumn,
    ILineage,
    IQueryMetastore,
    IDataTableSamples,
    ILineageCollection,
} from 'const/metastore';
import { convertRawToContentState } from 'lib/draft-js-utils';
import ds from 'lib/datasource';
import {
    IReceiveDataTableAction,
    ThunkResult,
    IReceiveDataTableSamplesAction,
    IReceiveDataJobMetadataAction,
    IReceiveParentDataLineageAction,
    IReceiveChildDataLineageAction,
    IReceiveQueryExampleIdsAction,
    ITableSampleParams,
} from './types';

interface IUpdateTableParams {
    description: ContentState;
    owner: string;
    golden: boolean;
}

const dataTableColumnSchema = new schema.Entity(
    'dataColumn',
    {},
    {
        processStrategy(value, parent, key) {
            return parent
                ? {
                      ...value,
                      table: parent.id,
                  }
                : value;
        },
    }
);
const dataSchemaSchema = new schema.Entity('dataSchema');

const dataTableSchema = new schema.Entity('dataTable', {
    column: [dataTableColumnSchema],
    schema: dataSchemaSchema,
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

export function fetchDataTable(tableId): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const { data } = await ds.fetch(`/table/${tableId}/`);
        const normalizedData = normalize(data, dataTableSchema);
        const {
            dataSchema = {},
            dataTable = {},
            dataColumn = {},
        } = normalizedData.entities;

        dispatch(receiveDataTable(dataSchema, dataTable, dataColumn));
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
    return async (dispatch, getState) => {
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
            } = normalizedData.entities;
            dispatch(receiveDataTable(dataSchema, dataTable, dataColumn));
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
    { description, owner, golden }: IUpdateTableParams
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const params: Partial<IDataTable> = {};

        if (description != null) {
            params.description = JSON.stringify(convertToRaw(description));
        }
        if (owner != null) {
            params.owner = owner;
        }
        if (golden != null) {
            params.golden = golden;
        }

        try {
            const { data } = await ds.update(`/table/${tableId}/`, params);

            const normalizedData = normalize(data, dataTableSchema);
            const { dataTable = {}, dataColumn = {} } = normalizedData.entities;

            dispatch(receiveDataTable({}, dataTable, dataColumn));
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
    return async (dispatch, getState) => {
        const raw = JSON.stringify(convertToRaw(description));
        const params = {
            description: raw,
        };
        try {
            const { data } = await ds.update(`/column/${columnId}/`, params);

            const normalizedData = normalize(data, dataTableColumnSchema);
            const { dataColumn = {} } = normalizedData.entities;
            dispatch(receiveDataTable({}, {}, dataColumn));
        } catch (error) {
            // dispatch({
            //     type: 'ERROR',
            //     error,
            // });
        }
    };
}

export function receiveDataTable(
    dataSchema,
    dataTable,
    dataColumn
): IReceiveDataTableAction {
    return {
        type: '@@dataSources/RECEIVE_DATA_TABLE',
        payload: {
            dataTablesById: Object.entries(dataTable).reduce(
                (hash, [id, table]) => {
                    const { description: rawDescription } = table as IDataTable;

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

export function fetchParentDataLineage(tableId): ThunkResult<Promise<void>> {
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

// function fetchTrustworthinessStats() {
//     return (dispatch, getState) => {
//         const state = getState().dataSources.trustworthinessStats;
//         if (state.loaded) {
//             return;
//         }

//         ds.fetch('/trustworthiness_stats/').then(resp => {
//             const {
//                 children_percentile: childrenPercentile,
//                 frequency_percentile: frequencyPercentile,
//             } = resp.data;
//             dispatch(
//                 receiveTrustworthinessStats(
//                     childrenPercentile,
//                     frequencyPercentile
//                 )
//             );
//         });
//     };
// }

// function receiveTrustworthinessStats(childrenPercentile, frequencyPercentile) {
//     return {
//         type: RECEIVE_TRUSTWORTHINESS_STATS,
//         childrenPercentile,
//         frequencyPercentile,
//     };
// }

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
): ThunkResult<Promise<IDataTableSamples>> {
    return async (dispatch, getState) => {
        try {
            const environmentId = getState().environment.currentEnvironmentId;
            const { data } = await ds.save(
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
            dispatch(receiveDataTableSamples(tableId, data));
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

function receiveQueryExampleIds(
    tableId: number,
    exampleIds: number[],
    hasMore: boolean
): IReceiveQueryExampleIdsAction {
    return {
        type: '@@dataSources/RECEIVE_QUERY_EXAMPLES',
        payload: {
            tableId,
            exampleIds,
            hasMore,
        },
    };
}

const QUERY_EXAMPLE_BATCH_SIZE = 5;

export function fetchQueryExampleIds(
    tableId: number,
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
                    limit,
                    offset,
                }
            );
            dispatch(
                receiveQueryExampleIds(tableId, data, data?.length === limit)
            );
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchQueryExampleIdsIfNeeded(
    tableId: number
): ThunkResult<Promise<number[]>> {
    return (dispatch, getState) => {
        const state = getState();
        const samples = state.dataSources.queryExampleIdsById[tableId];
        if (!samples) {
            return dispatch(fetchQueryExampleIds(tableId));
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

        return dispatch(
            fetchQueryExampleIds(tableId, samples?.queryIds?.length ?? 0)
        );
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
    return (dispatch, getState) => {
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
