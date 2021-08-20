import moment from 'moment';
import { normalize, schema } from 'normalizr';
import { mapValues } from 'lodash';
import { convertToRaw, ContentState } from 'draft-js';

import {
    IDataCell,
    IDataTextCell,
    IDataDoc,
    CELL_TYPE,
    IDataDocEditor,
    IDataCellMeta,
    IRawDataDoc,
} from 'const/datadoc';
import { IAccessRequest } from 'const/accessRequest';

import {
    DataDocSaveManager,
    DataCellSaveManager,
} from 'lib/batch/datadoc-save-manager';
import { getQueryEngineId } from 'lib/utils';
import { convertRawToContentState } from 'lib/richtext/serialize';
import dataDocSocket from 'lib/data-doc/datadoc-socketio';
import {
    IUpdateDataDocPollingAction,
    ThunkResult,
    IReceiveDataDocAction,
    ISaveDataDocEndAction,
    ISaveDataDocStartAction,
    IReceiveDataDocsAction,
} from './types';
import {
    DataDocPermission,
    permissionToReadWrite,
} from 'lib/data-doc/datadoc-permission';
import {
    DataDocAccessRequestResource,
    DataDocEditorResource,
    DataDocResource,
} from 'resource/dataDoc';

export const dataDocCellSchema = new schema.Entity(
    'dataDocCell',
    {},
    {
        processStrategy: (value, parent, key) =>
            parent
                ? {
                      ...value,
                      docId: parent.id,
                  }
                : value,
    }
);
export const dataDocSchema = new schema.Entity('dataDoc', {
    cells: [dataDocCellSchema],
});
const dataDocListSchema = [dataDocSchema];
const dataDocSaveManager = new DataDocSaveManager();
const dataCellSaveManager = new DataCellSaveManager();

export function deserializeCell(cell: IDataCell) {
    if (cell.cell_type === 'text') {
        const rawContext = (cell.context as any) as string;
        const context: ContentState = convertRawToContentState(rawContext);

        const newCell: IDataTextCell = {
            ...cell,
            context,
        };
        return newCell;
    }
    return cell;
}

export function normalizeRawDataDoc(rawDataDoc) {
    const normalizedData = normalize(rawDataDoc, dataDocSchema);
    const dataDoc = normalizedData.entities.dataDoc[normalizedData.result];
    const { dataDocCell: dataDocCellById = {} } = normalizedData.entities;
    const postProcessedCellById = mapValues(dataDocCellById, deserializeCell);

    return {
        dataDoc,
        dataDocCellById: postProcessedCellById,
    };
}

export function fetchDataDocs(filterMode: string): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState();
        const environmentId = state.environment.currentEnvironmentId;

        if (
            environmentId in state.dataDoc.loadedEnvironmentFilterMode &&
            filterMode in
                state.dataDoc.loadedEnvironmentFilterMode[environmentId]
        ) {
            return;
        }

        const { data: rawDataDocs } = await DataDocResource.getAll(
            filterMode,
            environmentId
        );
        const normalizedData = normalize(rawDataDocs, dataDocListSchema);

        const { dataDoc: dataDocById = {} } = normalizedData.entities;
        dispatch(receiveDataDocs(dataDocById, environmentId, filterMode));
    };
}

export function updateDataDocOwner(
    docId: number,
    nextOwnerId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const nextOwnerEditor = (getState().dataDoc.editorsByDocIdUserId[
            docId
        ] || {})[nextOwnerId];
        const { data } = await DataDocResource.updateOwner(
            docId,
            nextOwnerEditor.id
        );
        dispatch({
            type: '@@dataDoc/REMOVE_DATA_DOC_EDITOR',
            payload: {
                docId,
                uid: nextOwnerId,
            },
        });
        dispatch({
            type: '@@dataDoc/UPDATE_DATA_DOC_FIELD',
            payload: {
                docId,
                fieldName: 'owner_uid',
                fieldVal: nextOwnerId,
            },
        });
        dispatch({
            type: '@@dataDoc/RECEIVE_DATA_DOC_EDITOR',
            payload: {
                docId: data['data_doc_id'],
                editor: data,
            },
        });
    };
}

export function receiveDataDoc(
    dataDoc: IDataDoc,
    dataDocCellById: Record<number, IDataCell>
): IReceiveDataDocAction {
    return {
        type: '@@dataDoc/RECEIVE_DATA_DOC',
        payload: {
            dataDoc,
            dataDocCellById,
        },
    };
}

export function receiveDataDocs(
    dataDocById: Record<number, IDataDoc>,
    environmentId: number,
    filterMode: string
): IReceiveDataDocsAction {
    return {
        type: '@@dataDoc/RECEIVE_DATA_DOCS',
        payload: {
            dataDocById,
            environmentId,
            filterMode,
        },
    };
}

export function fetchDataDoc(docId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data: rawDataDoc } = await DataDocResource.get(docId);
        const { dataDoc, dataDocCellById } = normalizeRawDataDoc(rawDataDoc);
        dispatch(receiveDataDoc(dataDoc, dataDocCellById));

        return dataDoc;
    };
}

export function fetchDataDocIfNeeded(docId: number): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const state = getState();
        const dataDoc = state.dataDoc.dataDocById[docId];
        if (!dataDoc || !dataDoc.cells) {
            return fetchDataDoc(docId);
        }
    };
}

export function cloneDataDoc(docId: number): ThunkResult<Promise<IRawDataDoc>> {
    return async (dispatch) => {
        const { data: rawDataDoc } = await DataDocResource.clone(docId);
        const { dataDoc, dataDocCellById } = normalizeRawDataDoc(rawDataDoc);

        dispatch(receiveDataDoc(dataDoc, dataDocCellById));
        return dataDoc;
    };
}

export function createDataDoc(
    cells: Array<Partial<IDataCell>> = []
): ThunkResult<Promise<IDataDoc>> {
    return async (dispatch, getState) => {
        const { data: rawDataDoc } = await DataDocResource.create(
            cells,
            getState().environment.currentEnvironmentId
        );
        const { dataDoc, dataDocCellById } = normalizeRawDataDoc(rawDataDoc);
        dispatch(receiveDataDoc(dataDoc, dataDocCellById));

        return dataDoc;
    };
}

export function createDataDocFromAdhoc(
    queryExecutionId: number,
    engineId: number,
    queryString: string = ''
): ThunkResult<Promise<IDataDoc>> {
    return async (dispatch, getState) => {
        const state = getState();

        const { data: rawDataDoc } = await DataDocResource.createFromExecution(
            state.environment.currentEnvironmentId,
            queryExecutionId,
            engineId,
            queryString
        );
        const { dataDoc, dataDocCellById } = normalizeRawDataDoc(rawDataDoc);
        dispatch(receiveDataDoc(dataDoc, dataDocCellById));

        return dataDoc;
    };
}

export function deleteDataDoc(docId: number): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await DataDocResource.delete(docId);
        dispatch({
            type: '@@dataDoc/REMOVE_DATA_DOC',
            payload: {
                docId,
            },
        });
    };
}

export function insertDataDocCell(
    docId: number,
    index: number,
    cellType: CELL_TYPE,
    context: string | ContentState,
    meta: IDataCellMeta
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();

        const defaultContext = '';
        context = context || defaultContext;
        context =
            cellType === 'text'
                ? JSON.stringify(
                      convertToRaw(ContentState.createFromText(String(context)))
                  )
                : context;

        if (cellType === 'query') {
            const userSetting = state.user.computedSettings;
            const queryEngineIds =
                state.environment.environmentEngineIds[
                    state.environment.currentEnvironmentId
                ];
            const engine =
                meta && meta['engine'] != null
                    ? meta['engine']
                    : getQueryEngineId(
                          userSetting['default_query_engine'],
                          queryEngineIds
                      );
            meta = {
                ...meta,
                engine,
            };
        }

        return dataDocSocket.insertDataDocCell(
            docId,
            index,
            cellType,
            context as string,
            meta
        );
    };
}

export function deleteDataDocCell(docId: number, cellId: number) {
    return dataDocSocket.deleteDataCell(docId, cellId);
}

export function moveDataDocCursor(docId: number, cellId?: number) {
    return dataDocSocket.moveDataDocCursor(docId, cellId);
}

export function moveDataDocCell(
    docId: number,
    fromIndex: number,
    toIndex: number
) {
    return dataDocSocket.moveDataDocCell(docId, fromIndex, toIndex);
}

export function pasteDataCell(
    cellId: number,
    cut: boolean,
    docId: number,
    index: number
) {
    return dataDocSocket.pasteDataCell(cellId, cut, docId, index);
}

export function updateDataDocCell(
    docId: number,
    id: number,
    context?: string | ContentState,
    meta?: IDataCellMeta
): ThunkResult<Promise<void>> {
    return (dispatch) => {
        dispatch({
            type: '@@dataDoc/UPDATE_DATA_DOC_CELL_DATA',
            payload: {
                cellId: id,
                context,
                meta,
                docId,
            },
        });

        const saveCellTimeout = 5000;
        const completeAt = moment().add(saveCellTimeout, 'ms').unix();
        const saveKey = `cell-${id}`;
        const onSave = (start: boolean) => {
            dispatch(makeSaveDataDocPromise(start, docId, saveKey, completeAt));
        };

        onSave(true);
        return dataCellSaveManager
            .saveDataCell(docId, id, context, meta, saveCellTimeout)
            .then(onSave.bind(null, false), (e) => {
                // Clear the saving status
                onSave(false);
                throw e; // keep it up with the rejection chain
            });
    };
}

export function updateDataDocField(
    docId: number,
    fieldName: string,
    fieldVal: any
): ThunkResult<Promise<void>> {
    return (dispatch) => {
        dispatch({
            type: '@@dataDoc/UPDATE_DATA_DOC_FIELD',
            payload: {
                docId,
                fieldName,
                fieldVal,
            },
        });

        const saveTitleTimeout = 2500;
        const completeAt = moment().add(saveTitleTimeout, 'ms').unix();
        const saveKey = `doc-${docId}`;
        const onSave = (start: boolean) => {
            dispatch(makeSaveDataDocPromise(start, docId, saveKey, completeAt));
        };

        onSave(true);
        return dataDocSaveManager
            .saveDataDocField(docId, fieldName, fieldVal, saveTitleTimeout)
            .finally(
                // on failure, we pretend it saved!
                onSave.bind(null, false)
            );
    };
}

export function updateDataDocPolling(
    docId,
    queryExecutionId,
    polling
): IUpdateDataDocPollingAction {
    return {
        type: '@@dataDoc/UPDATE_DATA_DOC_POLLING',
        payload: {
            docId,
            queryExecutionId,
            polling,
        },
    };
}

export function favoriteDataDoc(docId: number): ThunkResult<void> {
    return async (dispatch) => {
        await DataDocResource.favorite(docId);
        dispatch({
            type: '@@dataDoc/RECEIVE_PINNED_DATA_DOC_ID',
            payload: {
                docId,
            },
        });
    };
}

export function unfavoriteDataDoc(docId: number): ThunkResult<void> {
    return async (dispatch) => {
        await DataDocResource.unfavorite(docId);
        dispatch({
            type: '@@dataDoc/REMOVE_PINNED_DATA_DOC_ID',
            payload: {
                docId,
            },
        });
    };
}

function makeSaveDataDocPromise(
    start: boolean, // true for start, false for end
    docId: number,
    key: string,
    completeAt: number // in ms
): ISaveDataDocStartAction | ISaveDataDocEndAction {
    return start
        ? {
              type: '@@dataDoc/SAVE_DATA_DOC_START',
              payload: {
                  docId,
                  key,
                  completeAt,
              },
          }
        : {
              type: '@@dataDoc/SAVE_DATA_DOC_END',
              payload: {
                  docId,
                  key,
                  completeAt,
              },
          };
}

export function forceSaveDataDoc(docId: number): ThunkResult<void> {
    return (dispatch, getState) => {
        const state = getState();
        const doc = state.dataDoc.dataDocById[docId];
        if (doc) {
            dataDocSaveManager.forceSaveDataDoc(docId);
            (doc.cells || [])
                .map((id) => state.dataDoc.dataDocCellById[id])
                .map((cell) =>
                    cell ? dataCellSaveManager.forceSaveDataCell(cell.id) : null
                );

            dispatch({
                type: '@@dataDoc/SAVE_DATA_DOC_CLEAR',
                payload: {
                    docId,
                },
            });
        }
    };
}

export function getDataDocEditors(
    docId: number
): ThunkResult<Promise<IDataDocEditor[]>> {
    return async (dispatch) => {
        const { data } = await DataDocEditorResource.get(docId);

        dispatch({
            type: '@@dataDoc/RECEIVE_DATA_DOC_EDITORS',
            payload: {
                docId,
                editors: data,
            },
        });

        return data;
    };
}

export function addDataDocEditors(
    docId: number,
    uid: number,
    permission: DataDocPermission
): ThunkResult<Promise<IDataDocEditor>> {
    return async (dispatch, getState) => {
        const request = (getState().dataDoc.accessRequestsByDocIdUserId[
            docId
        ] || {})[uid];
        const { read, write } = permissionToReadWrite(permission);
        const { data } = await DataDocEditorResource.create(
            docId,
            uid,
            read,
            write
        );
        if (request) {
            dispatch({
                type: '@@dataDoc/REMOVE_DATA_DOC_ACCESS_REQUEST',
                payload: {
                    docId,
                    uid,
                },
            });
        }
        dispatch({
            type: '@@dataDoc/RECEIVE_DATA_DOC_EDITOR',
            payload: {
                docId,
                editor: data,
            },
        });

        return data;
    };
}

export function updateDataDocEditors(
    docId: number,
    uid: number,
    read: boolean,
    write: boolean
): ThunkResult<Promise<IDataDocEditor>> {
    return async (dispatch, getState) => {
        const editor = (getState().dataDoc.editorsByDocIdUserId[docId] || {})[
            uid
        ];
        if (editor) {
            const {
                data,
            }: {
                data: IDataDocEditor;
            } = await DataDocEditorResource.update(editor.id, read, write);

            dispatch({
                type: '@@dataDoc/RECEIVE_DATA_DOC_EDITOR',
                payload: {
                    docId,
                    editor: data,
                },
            });
            return data;
        }
    };
}

export function deleteDataDocEditor(
    docId: number,
    uid: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const editor = (getState().dataDoc.editorsByDocIdUserId[docId] || {})[
            uid
        ];
        if (editor) {
            await DataDocEditorResource.delete(editor.id);
            dispatch({
                type: '@@dataDoc/REMOVE_DATA_DOC_EDITOR',
                payload: {
                    docId,
                    uid,
                },
            });
        }
    };
}

export function addDataDocAccessRequest(
    docId: number
): ThunkResult<Promise<IAccessRequest>> {
    return async (dispatch) => {
        const { data } = await DataDocAccessRequestResource.create(docId);
        if (data != null) {
            dispatch({
                type: '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUEST',
                payload: {
                    docId,
                    request: data,
                },
            });
        }
        return data;
    };
}

export function rejectDataDocAccessRequest(
    docId: number,
    uid: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const accessRequest = (getState().dataDoc.accessRequestsByDocIdUserId[
            docId
        ] || {})[uid];
        if (accessRequest) {
            await DataDocAccessRequestResource.delete(docId, uid);
            dispatch({
                type: '@@dataDoc/REMOVE_DATA_DOC_ACCESS_REQUEST',
                payload: {
                    docId,
                    uid,
                },
            });
        }
    };
}
