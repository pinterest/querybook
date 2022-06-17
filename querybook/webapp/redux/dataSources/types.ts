import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import {
    FunctionDocumentationCollection,
    IDataColumn,
    IDataJobMetadata,
    IDataSchema,
    IDataTable,
    IDataTableOwnership,
    IDataTableSamples,
    IDataTableSamplesPolling,
    IDataTableWarning,
    IFunctionDescription,
    ILineage,
    ILineageCollection,
    IPaginatedQuerySampleFilters,
    IPaginatedQuerySamples,
    IQueryMetastore,
    ITableQueryEngine,
    ITableStats,
    ITopQueryConcurrences,
    ITopQueryUser,
} from 'const/metastore';

import { IStoreState } from '../store/types';

export interface IReceiveQueryMetastoresAction extends Action {
    type: '@@dataSources/RECEIVE_QUERY_METASTORES';
    payload: {
        queryMetastores: IQueryMetastore[];
    };
}

export interface IReceiveDataTableAction extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE';
    payload: {
        dataTablesById: Record<number, IDataTable>;
        dataColumnsById: Record<number, IDataColumn>;
        dataSchemasById: Record<number, IDataSchema>;
        dataTableWarningById: Record<number, IDataTableWarning>;
    };
}

export interface IReceiveParentDataLineageAction extends Action {
    type: '@@dataSources/RECEIVE_PARENT_DATA_LINEAGE';
    payload: {
        lineages: ILineage[];
        tableId: number;
    };
}

export interface IReceiveChildDataLineageAction extends Action {
    type: '@@dataSources/RECEIVE_CHILD_DATA_LINEAGE';
    payload: {
        lineages: ILineage[];
        tableId: number;
    };
}

export interface IReceiveDataJobMetadataAction extends Action {
    type: '@@dataSources/RECEIVE_DATA_JOB_METADATA';
    payload: {
        dataJobMetadata: any;
    };
}

export interface IReceiveGoldenTablesAction extends Action {
    type: '@@dataSources/RECEIVE_GOLDEN_TABLES';
    payload: {
        goldenTables: IDataTable[];
    };
}

export interface IReceiveDataTableSamplesAction extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE_SAMPLES';
    payload: {
        tableId: number;
        samples: IDataTableSamples;
    };
}

export interface IReceiveDataTableSamplesPollingAction extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE_SAMPLES_POLLING';
    payload: {
        tableId: number;
        taskId: number;
        progress: number;
        finished: boolean;
    };
}

export interface IReceiveQueryExampleIdsAction extends Action {
    type: '@@dataSources/RECEIVE_QUERY_EXAMPLES';
    payload: {
        tableId: number;
        exampleIds: number[];
        hasMore: boolean;
        filters: IPaginatedQuerySampleFilters;
    };
}

export interface ILoadingFunctionDocumentationAction extends Action {
    type: '@@dataSources/LOADING_FUNCTION_DOCUMENTATION';
    payload: {
        language: string;
        promise: Promise<any>;
    };
}

export interface IReceiveFunctionDocumentationAction extends Action {
    type: '@@dataSources/RECEIVE_FUNCTION_DOCUMENTATION';
    payload: {
        language: string;
        functionDocumentationByName: Record<string, IFunctionDescription[]>;
    };
}

export interface IReceiveTopQueryUsersAction extends Action {
    type: '@@dataSources/RECEIVE_TOP_QUERY_USERS';
    payload: {
        tableId: number;
        users: ITopQueryUser[];
    };
}

export interface IReceiveTableQueryEnginesAction extends Action {
    type: '@@dataSources/RECEIVE_TABLE_QUERY_ENGINES';
    payload: {
        tableId: number;
        engines: ITableQueryEngine[];
    };
}

export interface IReceiveTopQueryJoinsAction extends Action {
    type: '@@dataSources/RECEIVE_TOP_QUERY_CONCURRENCES';
    payload: {
        tableId: number;
        joins: ITopQueryConcurrences[];
    };
}

export interface IReceiveDataTableWarning extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE_WARNING';
    payload: IDataTableWarning;
}

export interface IRemoveDataTableWarning extends Action {
    type: '@@dataSources/REMOVE_DATA_TABLE_WARNING';
    payload: IDataTableWarning;
}

export interface IReceiveDataTableStats extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE_STATS';
    payload: {
        tableId: number;
        stat: ITableStats[];
    };
}

export interface IReceiveDataTableOwnership extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE_OWNERSHIPS';
    payload: {
        tableId: number;
        ownerships: IDataTableOwnership[];
    };
}
export interface IAddDataTableOwnership extends Action {
    type: '@@dataSources/RECEIVE_DATA_TABLE_OWNERSHIP';
    payload: {
        tableId: number;
        ownership: IDataTableOwnership;
    };
}
export interface IRemoveDataTableOwnership extends Action {
    type: '@@dataSources/REMOVE_DATA_TABLE_OWNERSHIP';
    payload: {
        tableId: number;
        uid: number;
    };
}

export type DataSourcesAction =
    | IReceiveQueryMetastoresAction
    | IReceiveDataTableAction
    | IReceiveParentDataLineageAction
    | IReceiveChildDataLineageAction
    | IReceiveDataJobMetadataAction
    | IReceiveDataJobMetadataAction
    | IReceiveGoldenTablesAction
    | IReceiveDataTableSamplesAction
    | IReceiveDataTableSamplesPollingAction
    | IReceiveQueryExampleIdsAction
    | ILoadingFunctionDocumentationAction
    | IReceiveFunctionDocumentationAction
    | IReceiveDataTableWarning
    | IRemoveDataTableWarning
    | IReceiveDataTableOwnership
    | IReceiveDataTableStats
    | IAddDataTableOwnership
    | IRemoveDataTableOwnership
    | IReceiveTopQueryUsersAction
    | IReceiveTableQueryEnginesAction
    | IReceiveTopQueryJoinsAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    DataSourcesAction
>;

export interface IDataSourcesState {
    queryMetastoreById: Record<number, IQueryMetastore>;
    goldenTableNameToId: Record<string, number>;
    dataTablesById: Record<number, IDataTable>;
    dataSchemasById: Record<number, IDataSchema>;
    dataColumnsById: Record<number, IDataColumn>;
    dataTableWarningById: Record<number, IDataTableWarning>;
    dataTableStatByTableId: Record<number, ITableStats[]>;
    dataTableOwnershipByTableId: Record<number, IDataTableOwnership[]>;

    // By MetastoreId -> name -> tableId
    dataTableNameToId: Record<number, Record<string, number>>;
    functionDocumentation: {
        byNameByLanguage: FunctionDocumentationCollection;
        loading: Record<string, Promise<any>>;
    };
    dataJobMetadataById: Record<number, IDataJobMetadata>;

    dataTablesSamplesById: Record<number, IDataTableSamples>;
    dataTablesSamplesPollingById: Record<number, IDataTableSamplesPolling>;

    queryExampleIdsById: Record<number, IPaginatedQuerySamples>;
    queryTopUsersByTableId: Record<number, ITopQueryUser[]>;
    queryEnginesByTableId: Record<number, ITableQueryEngine[]>;
    queryTopConcurrencesByTableId: Record<number, ITopQueryConcurrences[]>;

    dataLineages: ILineageCollection;
}
