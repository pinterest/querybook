import { produce } from 'immer';
import { combineReducers } from 'redux';

import { arrayGroupByField } from 'lib/utils';
import { IDataSourcesState, DataSourcesAction } from './types';

const initialState: IDataSourcesState = {
    goldenTableNameToId: {},
    dataTablesById: {},
    dataSchemasById: {},
    dataColumnsById: {},
    dataTableWarningById: {},
    dataTableNameToId: {},
    functionDocumentationByNameByLanguage: {},
    dataJobMetadataById: {},
    queryMetastoreById: {},

    dataTablesSamplesById: {},
    dataTablesSamplesPollingById: {},

    queryExampleIdsById: {},
    queryTopUsersByTableId: {},

    // trustworthinessStats: {
    //     loaded: false,
    // },

    dataLineages: {
        parentLineage: {},
        childLineage: {},
    },
};

function dataTableNameToId(
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

function functionDocumentationByNameByLanguage(
    state = initialState.functionDocumentationByNameByLanguage,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            // TODO: implement this with correct typing
            // case '@@dataSources/LOADING_FUNCTION_DOCUMENTATION': {
            //     const { language, promise } = action.payload;
            //     draft[language] = promise;
            //     return;
            // }
            case '@@dataSources/RECEIVE_FUNCTION_DOCUMENTATION': {
                const {
                    language,
                    functionDocumentationByName,
                } = action.payload;
                draft[language] = functionDocumentationByName;
                return;
            }
        }
    });
}

function dataColumnsById(
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

function dataTablesById(
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

function dataSchemasById(
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

function dataTableWarningById(
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

function dataJobMetadataById(
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

function dataTablesSamplesById(
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

function dataTablesSamplesPollingById(
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

function queryExampleIdsById(
    state = initialState.queryExampleIdsById,
    action: DataSourcesAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataSources/RECEIVE_QUERY_EXAMPLES': {
                const { tableId, exampleIds, hasMore } = action.payload;
                draft[tableId] = draft[tableId] || {
                    hasMore: true,
                    queryIds: [],
                };
                draft[tableId].queryIds = draft[tableId].queryIds.concat(
                    exampleIds
                );
                draft[tableId].queryIds = Array.from(
                    new Set(draft[tableId].queryIds)
                );
                draft[tableId].hasMore = hasMore;

                return;
            }
        }
        return;
    });
}

function queryTopUsersByTableId(
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

function goldenTableNameToId(
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

function dataLineages(
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

function queryMetastoreById(
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

export default combineReducers({
    queryMetastoreById,
    goldenTableNameToId,
    dataTableNameToId,
    functionDocumentationByNameByLanguage,
    dataColumnsById,
    dataTablesById,
    dataSchemasById,
    dataJobMetadataById,
    dataTablesSamplesById,
    dataTablesSamplesPollingById,
    queryExampleIdsById,
    queryTopUsersByTableId,
    dataLineages,
    dataTableWarningById,
});
