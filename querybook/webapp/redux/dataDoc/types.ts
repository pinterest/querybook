import { ContentState } from 'draft-js';
import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IAccessRequest } from 'const/accessRequest';
import {
    IDataCell,
    IDataCellMeta,
    IDataDoc,
    IDataDocDAGExport,
    IDataDocDAGExporter,
    IDataDocEditor,
    IRawDataDoc,
} from 'const/datadoc';

import { IStoreState } from '../store/types';

export interface IDataDocSavePromise {
    // Key: cell-<cell id> or doc-<doc-id>
    // Value: the time save promise will activate
    itemToSave: Record<string, number>;
    lastUpdatedAt: number;
}

export interface IReceiveDataDocsAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOCS';
    payload: {
        dataDocById: Record<number, IDataDoc>;
        rawDataDocs: IRawDataDoc[];
        environmentId: number;
        filterMode: string;
    };
}

export interface IReceiveDataDocAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC';
    payload: {
        dataDoc: IDataDoc;
        dataDocCellById: Record<number, IDataCell>;
    };
}

export interface IReceiveDataDocUpdateAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_UPDATE';
    payload: {
        dataDoc: IDataDoc;
        dataDocCellById?: Record<number, IDataCell>;
    };
}

export interface IReceiveDataCellAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_CELL';
    payload: {
        dataDocCellById: Record<number, IDataCell>;
    };
}

export interface IRemoveDataDocAction extends Action {
    type: '@@dataDoc/REMOVE_DATA_DOC';
    payload: {
        docId: number;
    };
}

export interface IReceiveFavoriteDataDocIdAction extends Action {
    type: '@@dataDoc/RECEIVE_PINNED_DATA_DOC_ID';
    payload: {
        docId: number;
    };
}

export interface IRemoveFavoriteDataDocIdAction extends Action {
    type: '@@dataDoc/REMOVE_PINNED_DATA_DOC_ID';
    payload: {
        docId: number;
    };
}

export interface IInsertDataDocCellAction extends Action {
    type: '@@dataDoc/INSERT_DATA_DOC_CELL';
    payload: {
        cell: IDataCell;
        docId: number;
        index: number;
    };
}

export interface IDeleteDataDocCellAction extends Action {
    type: '@@dataDoc/DELETE_DATA_DOC_CELL';
    payload: {
        cellId: number;
        docId: number;
    };
}

export interface IUpdateDataDocCellDataAction extends Action {
    type: '@@dataDoc/UPDATE_DATA_DOC_CELL_DATA';
    payload: {
        cellId: number;

        context?: string | ContentState;
        meta?: IDataCellMeta;
    };
}

export interface IUpdateDataDocCellAction extends Action {
    type: '@@dataDoc/UPDATE_DATA_DOC_CELL';
    payload: {
        cell: IDataCell;
        docId: number;
    };
}

export interface IMoveDataDocCellAction extends Action {
    type: '@@dataDoc/MOVE_DATA_DOC_CELL';
    payload: {
        docId: number;
        fromIndex: number;
        toIndex: number;
    };
}

export interface IUpdateDataDocTitleAction extends Action {
    type: '@@dataDoc/UPDATE_DATA_DOC_FIELD';
    payload: {
        docId: number;
        fieldName: string;
        fieldVal: any;
    };
}

export interface IUpdateDataDocPollingAction extends Action {
    type: '@@dataDoc/UPDATE_DATA_DOC_POLLING';
    payload: {
        docId: number;
        queryExecutionId: number;
        polling: boolean;
    };
}

export interface ISaveDataDocStartAction extends Action {
    type: '@@dataDoc/SAVE_DATA_DOC_START';
    payload: {
        docId: number;
        key: string;
        completeAt: number;
    };
}

export interface ISaveDataDocEndAction extends Action {
    type: '@@dataDoc/SAVE_DATA_DOC_END';
    payload: {
        docId: number;
        key: string;
        completeAt: number;
    };
}

export interface ISaveDataDocClearAction extends Action {
    type: '@@dataDoc/SAVE_DATA_DOC_CLEAR';
    payload: {
        docId: number;
    };
}

export interface IReceiveDataDocSessionsAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_SESSIONS';
    payload: {
        docId: number;
        sidToUid: Record<string, number>;
        sidToCellId: Record<string, number>;
    };
}

export interface IReceiveDataDocUserAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_USER';
    payload: {
        docId: number;
        sid: string;
        uid: number;
    };
}

export interface IRemoveDataDocUserAction extends Action {
    type: '@@dataDoc/REMOVE_DATA_DOC_USER';
    payload: {
        docId: number;
        sid: string;
    };
}

export interface IReceiveDataDocEditorsAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_EDITORS';
    payload: {
        docId: number;
        editors: IDataDocEditor[];
    };
}

export interface IReceiveDataDocEditorAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_EDITOR';
    payload: {
        docId: number;
        editor: IDataDocEditor;
    };
}

export interface IRemoveDataDocEditorAction extends Action {
    type: '@@dataDoc/REMOVE_DATA_DOC_EDITOR';
    payload: {
        docId: number;
        uid: number;
    };
}
export interface IReceiveDataDocAccessRequestsAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUESTS';
    payload: {
        docId: number;
        requests: IAccessRequest[];
    };
}

export interface IReceiveDataDocAccessRequestAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUEST';
    payload: {
        docId: number;
        request: IAccessRequest;
    };
}

export interface IRemoveDataDocAccessRequestAction extends Action {
    type: '@@dataDoc/REMOVE_DATA_DOC_ACCESS_REQUEST';
    payload: {
        docId: number;
        uid: number;
    };
}

export interface IMoveDataDocCursor extends Action {
    type: '@@dataDoc/MOVE_DATA_DOC_CURSOR';
    payload: {
        docId: number;
        cellId?: number;
        sid: string;
    };
}

export interface IReceiveDataDocDAGExportAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_DAG_EXPORT';
    payload: {
        docId: number;
        DAGExport: IDataDocDAGExport;
    };
}
export interface IReceiveDataDocDAGExportersAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_DOC_EXPORTERS';
    payload: {
        exporters: IDataDocDAGExporter[];
    };
}

export type DataDocAction =
    | IReceiveDataDocsAction
    | IReceiveDataDocAction
    | IReceiveDataCellAction
    | IRemoveDataDocAction
    | IReceiveFavoriteDataDocIdAction
    | IRemoveFavoriteDataDocIdAction
    | IInsertDataDocCellAction
    | IUpdateDataDocCellAction
    | IUpdateDataDocCellDataAction
    | IDeleteDataDocCellAction
    | IMoveDataDocCellAction
    | IUpdateDataDocTitleAction
    | IUpdateDataDocPollingAction
    | ISaveDataDocStartAction
    | ISaveDataDocEndAction
    | ISaveDataDocClearAction
    | IReceiveDataDocUpdateAction
    | IReceiveDataDocSessionsAction
    | IReceiveDataDocUserAction
    | IRemoveDataDocUserAction
    | IReceiveDataDocEditorsAction
    | IReceiveDataDocEditorAction
    | IRemoveDataDocEditorAction
    | IReceiveDataDocAccessRequestsAction
    | IReceiveDataDocAccessRequestAction
    | IRemoveDataDocAccessRequestAction
    | IMoveDataDocCursor
    | IReceiveDataDocDAGExportAction
    | IReceiveDataDocDAGExportersAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    DataDocAction
>;

export type ThunkDispatch = UntypedThunkDispatch<
    IStoreState,
    undefined,
    DataDocAction
>;

export interface IDataDocState {
    dataDocById: Record<number, IDataDoc>;
    dataDocCellById: Record<number, IDataCell>;
    loadedEnvironmentFilterMode: Record<number, Record<string, boolean>>;
    docIdToQueryExecution: Record<number, Record<number, true>>;
    dataDocSavePromiseById: Record<number, IDataDocSavePromise>;
    sessionByDocId: Record<
        number,
        Record<
            string,
            {
                uid: number;
                cellId?: number;
            }
        >
    >;
    editorsByDocIdUserId: Record<number, Record<number, IDataDocEditor>>;
    accessRequestsByDocIdUserId: Record<number, Record<number, IAccessRequest>>;
    favoriteDataDocIds: number[];
    recentDataDocIds: number[];
    dagExportByDocId: Record<number, IDataDocDAGExport>;
    dagExporterDataByName: Record<string, IDataDocDAGExporter>;
}
