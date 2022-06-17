import { createSelector } from 'reselect';

import { IDataColumn } from 'const/metastore';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { IStoreState } from 'redux/store/types';

const queryMetastoreByIdSelector = (state: IStoreState) =>
    state.dataSources.queryMetastoreById;

export const queryMetastoresSelector = createSelector(
    queryMetastoreByIdSelector,
    queryEngineByIdEnvSelector,
    (queryMetastoreById, queryEngineById) =>
        [
            ...new Set(
                Object.values(queryEngineById)
                    .filter(
                        (engine) =>
                            engine.metastore_id &&
                            engine.metastore_id in queryMetastoreById
                    )
                    .map((engine) => engine.metastore_id)
            ),
        ]
            .map((metastoreId) => queryMetastoreById[metastoreId])
            .sort((m) => m.id)
);

const tableSelector = (state: IStoreState, tableId: number) =>
    state.dataSources.dataTablesById[tableId];

export const fullTableSelector = createSelector(
    tableSelector,
    (state: IStoreState) => state.dataSources.dataSchemasById,
    (state: IStoreState) => state.dataSources.dataColumnsById,
    (state: IStoreState) => state.dataSources.dataTableWarningById,
    (
        tableFromState,
        dataSchemasById,
        dataColumnsById,
        dataTableWarningById
    ) => {
        const schemaFromState = tableFromState
            ? dataSchemasById[tableFromState.schema]
            : null;
        if (!tableFromState || !schemaFromState) {
            return {};
        }

        const tableColumnsFromState: IDataColumn[] = (
            tableFromState?.column ?? []
        ).map((id) => dataColumnsById[id]);

        const tableNameFromState =
            tableFromState && schemaFromState
                ? `${schemaFromState.name}.${tableFromState.name}`
                : '';

        return {
            table: tableFromState,
            schema: schemaFromState,
            tableName: tableNameFromState,
            tableColumns: tableColumnsFromState,
            tableWarnings: (tableFromState?.warnings ?? [])
                .map((id) => dataTableWarningById[id])
                .filter((warning) => warning),
        };
    }
);
