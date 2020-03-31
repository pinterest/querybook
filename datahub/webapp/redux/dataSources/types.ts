import { Action, Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';

import {
    IDataTable,
    IDataColumn,
    IDataSchema,
    ILineage,
    IDataTableSamples,
    IFunctionDescription,
    IQueryMetastore,
    FunctionDocumentationCollection,
    ILineageCollection,
    IDataJobMetadata,
    IPaginatedQuerySamples,
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

export interface IReceiveQueryExampleIdsAction extends Action {
    type: '@@dataSources/RECEIVE_QUERY_EXAMPLES';
    payload: {
        tableId: number;
        exampleIds: number[];
        hasMore: boolean;
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

export type DataSourcesAction =
    | IReceiveQueryMetastoresAction
    | IReceiveDataTableAction
    | IReceiveParentDataLineageAction
    | IReceiveChildDataLineageAction
    | IReceiveDataJobMetadataAction
    | IReceiveDataJobMetadataAction
    | IReceiveGoldenTablesAction
    | IReceiveDataTableSamplesAction
    | IReceiveQueryExampleIdsAction
    | ILoadingFunctionDocumentationAction
    | IReceiveFunctionDocumentationAction;

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

    // By MetastoreId -> name -> tableId
    dataTableNameToId: Record<number, Record<string, number>>;
    functionDocumentationByNameByLanguage: FunctionDocumentationCollection;
    dataJobMetadataById: Record<number, IDataJobMetadata>;

    dataTablesSamplesById: Record<number, IDataTableSamples>;
    queryExampleIdsById: Record<number, IPaginatedQuerySamples>;

    dataLineages: ILineageCollection;
}
