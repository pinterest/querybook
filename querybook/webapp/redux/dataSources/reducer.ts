import { produce } from 'immer';
import { combineReducers } from 'redux';
import { isEqual } from 'lodash';

import { arrayGroupByField } from 'lib/utils';
import { IDataSourcesState, DataSourcesAction } from './types';

const initialState: IDataSourcesState = {
    goldenTableNameToId: {},
    dataTablesById: {},
    dataSchemasById: {},
    dataColumnsById: {},
    dataTableWarningById: {},
    dataTableOwnershipByTableId: {},
    dataTableNameToId: {},
    functionDocumentation: {
        byNameByLanguage: {},
        loading: {},
    },
    dataJobMetadataById: {},
    queryMetastoreById: {},

    dataTablesSamplesById: {},
    dataTablesSamplesPollingById: {},

    queryExampleIdsById: {},
    queryTopUsersByTableId: {},
    queryEnginesByTableId: {},
    queryTopConcurrencesByTableId: {},

    dataTableStatByTableId: {},
    dataLineages: {
        parentLineage: {},
        childLineage: {},
    },
};

function dataTableNameToIdReducer(
    state = initialState.dataTableNameToId,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_DATA_TABLE': {
                const { dataSchemasById, dataTablesById } = action.payload;
                for (const [id, table] of Object.entries(dataTablesById)) {
                    const schema = dataSchemasById[table.schema];
                    if (schema) {
                        draft[schema.metastore_id] =
                            draft[schema.metastore_id] || {};
                        draft[schema.metastore_id][
                            `${schema.name}.${table.name}`
                        ] = Number(id);
                    }
                }
                return;
            }
        }
    });
}

function functionDocumentationReducer(
    state = initialState.functionDocumentation,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/LOADING_FUNCTION_DOCUMENTATION': {
                const { language, promise } = action.payload;
                draft.loading[language] = promise;
                return;
            }
            case '@@dataSources/RECEIVE_FUNCTION_DOCUMENTATION': {
                const {
                    language,
                    functionDocumentationByName,
                } = action.payload;
                draft.byNameByLanguage[language] = functionDocumentationByName;
                delete draft.loading[language];
                return;
            }
        }
    });
}

function dataColumnsByIdReducer(
    state = initialState.dataColumnsById,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_DATA_TABLE': {
                const { dataColumnsById } = action.payload;
                for (const [id, column] of Object.entries(dataColumnsById)) {
                    draft[id] = {
                        ...draft[id],
                        ...column,
                    };
                }
                return;
            }
        }
    });
}

function dataTablesByIdReducer(
    state = initialState.dataTablesById,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_DATA_TABLE': {
                const { dataTablesById } = action.payload;
                for (const [id, table] of Object.entries(dataTablesById)) {
                    draft[id] = {
                        ...draft[id],
                        ...table,
                    };
                }
                return;
            }
            case '@@dataSources/RECEIVE_DATA_TABLE_WARNING': {
                const warning = action.payload;
                if (!draft[warning.table_id].warnings.includes(warning.id)) {
                    draft[warning.table_id].warnings.push(warning.id);
                }
                return;
            }
            case '@@dataSources/REMOVE_DATA_TABLE_WARNING': {
                const warning = action.payload;
                draft[warning.table_id].warnings.filter(
                    (w) => w !== warning.id
                );
                return;
            }
        }
    });
}

function dataSchemasByIdReducer(
    state = initialState.dataSchemasById,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_DATA_TABLE': {
            const { dataSchemasById } = action.payload;

            return {
                ...state,
                ...dataSchemasById,
            };
        }
        default: {
            return state;
        }
    }
}

function dataTableWarningByIdReducer(
    state = initialState.dataTableWarningById,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_DATA_TABLE': {
            const { dataTableWarningById } = action.payload;

            return {
                ...state,
                ...dataTableWarningById,
            };
        }
        case '@@dataSources/RECEIVE_DATA_TABLE_WARNING': {
            const warning = action.payload;
            return {
                ...state,
                [warning.id]: warning,
            };
        }
        case '@@dataSources/REMOVE_DATA_TABLE_WARNING': {
            const warning = action.payload;
            const { [warning.id]: _, ...newState } = state;
            return newState;
        }
        default: {
            return state;
        }
    }
}

function dataTableOwnershipByTableIdReducer(
    state = initialState.dataTableOwnershipByTableId,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_DATA_TABLE_OWNERSHIPS': {
            const { tableId, ownerships } = action.payload;
            return {
                ...state,
                [tableId]: ownerships,
            };
        }
        case '@@dataSources/RECEIVE_DATA_TABLE_OWNERSHIP': {
            const { tableId, ownership } = action.payload;
            return {
                ...state,
                [tableId]: [...state[tableId], ownership],
            };
        }
        case '@@dataSources/REMOVE_DATA_TABLE_OWNERSHIP': {
            const { tableId, uid } = action.payload;
            const updatedState = state[tableId].filter(
                (ownership) => ownership.uid !== uid
            );
            return {
                ...state,
                [tableId]: updatedState,
            };
        }
        default: {
            return state;
        }
    }
}

function dataJobMetadataByIdReducer(
    state = initialState.dataJobMetadataById,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_DATA_JOB_METADATA': {
            const { dataJobMetadata } = action.payload;
            return {
                ...state,
                [dataJobMetadata.id]: {
                    __loading: false, // will be overriden if loading is set to true
                    ...dataJobMetadata,
                },
            };
        }
    }
    return state;
}

function dataTablesSamplesByIdReducer(
    state = initialState.dataTablesSamplesById,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_DATA_TABLE_SAMPLES': {
            const { tableId, samples } = action.payload;
            return {
                ...state,
                [tableId]: samples,
            };
        }
    }
    return state;
}

function dataTablesSamplesPollingByIdReducer(
    state = initialState.dataTablesSamplesPollingById,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_DATA_TABLE_SAMPLES_POLLING': {
                const { tableId, taskId, progress, finished } = action.payload;
                if (finished) {
                    delete draft[tableId];
                } else {
                    draft[tableId] = {
                        ...draft[tableId],
                        taskId,
                        progress,
                    };
                }
                return;
            }
        }
    });
}

function queryExampleIdsByIdReducer(
    state = initialState.queryExampleIdsById,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_QUERY_EXAMPLES': {
                const {
                    tableId,
                    exampleIds,
                    hasMore,
                    filters,
                } = action.payload;
                draft[tableId] = draft[tableId] || {
                    hasMore: true,
                    queryIds: [],
                    filters: {},
                };
                const sameFilter = isEqual(filters, draft[tableId].filters);
                draft[tableId].queryIds = sameFilter
                    ? draft[tableId].queryIds.concat(exampleIds)
                    : exampleIds;
                draft[tableId].hasMore = hasMore;
                draft[tableId].filters = filters;

                return;
            }
        }
        return;
    });
}

function queryTopUsersByTableIdReducer(
    state = initialState.queryTopUsersByTableId,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_TOP_QUERY_USERS': {
                const { tableId, users } = action.payload;
                draft[tableId] = users;
                return;
            }
        }
    });
}

function queryEnginesByTableIdReducer(
    state = initialState.queryEnginesByTableId,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_TABLE_QUERY_ENGINES': {
                const { tableId, engines } = action.payload;
                draft[tableId] = engines;
                return;
            }
        }
    });
}

function queryTopConcurrencesByTableIdReducer(
    state = initialState.queryTopConcurrencesByTableId,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_TOP_QUERY_CONCURRENCES': {
                const { tableId, joins } = action.payload;
                draft[tableId] = joins;
                return;
            }
        }
    });
}

function goldenTableNameToIdReducer(
    state = initialState.goldenTableNameToId,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_GOLDEN_TABLES': {
            const { goldenTables } = action.payload;

            return goldenTables.reduce((hash, table) => {
                hash[`${table.schema}.${table.name}`] = table.id;
                return hash;
            }, {});
        }
    }
    return state;
}

function dataLineagesReducer(
    state = initialState.dataLineages,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_PARENT_DATA_LINEAGE': {
            const lineages = action.payload.lineages;
            const tableId = action.payload.tableId;

            const parentLineages = {
                ...state.parentLineage,
                [tableId]: lineages,
            };
            return {
                ...state,
                parentLineage: parentLineages,
            };
        }
        case '@@dataSources/RECEIVE_CHILD_DATA_LINEAGE': {
            const lineages = action.payload.lineages;
            const tableId = action.payload.tableId;

            const childLineages = {
                ...state.childLineage,
                [tableId]: lineages,
            };
            return {
                ...state,
                childLineage: childLineages,
            };
        }
    }
    return state;
}

function queryMetastoreByIdReducer(
    state = initialState.queryMetastoreById,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_QUERY_METASTORES': {
            return {
                ...state,
                ...arrayGroupByField(action.payload.queryMetastores),
            };
        }
    }
    return state;
}

function dataTableStatByTableIdReducer(
    state = initialState.dataTableStatByTableId,
    action: DataSourcesAction
) {
    switch (action.type) {
        case '@@dataSources/RECEIVE_DATA_TABLE_STATS': {
            return {
                ...state,
                [action.payload.tableId]: action.payload.stat,
            };
        }
    }
    return state;
}

export default combineReducers({
    queryMetastoreById: queryMetastoreByIdReducer,
    goldenTableNameToId: goldenTableNameToIdReducer,
    dataTableNameToId: dataTableNameToIdReducer,
    functionDocumentation: functionDocumentationReducer,
    dataColumnsById: dataColumnsByIdReducer,
    dataTablesById: dataTablesByIdReducer,
    dataSchemasById: dataSchemasByIdReducer,
    dataJobMetadataById: dataJobMetadataByIdReducer,
    dataTablesSamplesById: dataTablesSamplesByIdReducer,
    dataTablesSamplesPollingById: dataTablesSamplesPollingByIdReducer,
    queryExampleIdsById: queryExampleIdsByIdReducer,
    queryTopUsersByTableId: queryTopUsersByTableIdReducer,
    queryEnginesByTableId: queryEnginesByTableIdReducer,
    queryTopConcurrencesByTableId: queryTopConcurrencesByTableIdReducer,
    dataLineages: dataLineagesReducer,
    dataTableWarningById: dataTableWarningByIdReducer,
    dataTableOwnershipByTableId: dataTableOwnershipByTableIdReducer,
    dataTableStatByTableId: dataTableStatByTableIdReducer,
});
