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
} from 'const/datadoc';
import ds from 'lib/datasource';
import {
    DataDocSaveManager,
    DataCellSaveManager,
} from 'lib/batch/datadoc-save-manager';
import { getQueryEngineId } from 'lib/utils';
import { convertRawToContentState } from 'lib/draft-js-utils';
import dataDocSocket from 'lib/data-doc/datadoc-socketio';
import {
    IUpdateDataDocPollingAction,
    ThunkResult,
    IReceiveDataDocAction,
    ISaveDataDocEndAction,
    ISaveDataDocStartAction,
    IReceiveDataDocsAction,
} from './types';

export const dataDocCellSchema = new schema.Entity(
    'dataDocCell',
    {},
    {
        processStrategy(value, parent, key) {
            return parent
                ? {
                      ...value,
                      docId: parent.id,
                  }
                : value;
        },
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

        const { data: rawDataDocs } = await ds.fetch('/datadoc/', {
            filter_mode: filterMode,
            environment_id: environmentId,
        });
        const normalizedData = normalize(rawDataDocs, dataDocListSchema);

        const { dataDoc: dataDocById = {} } = normalizedData.entities;
        dispatch(receiveDataDocs(dataDocById, environmentId, filterMode));
    };
}

export function updateDataDocOwner(
    docId: number,
    currentOwnerId: number,
    nextOwnerId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const nextOwnerEditor = (getState().dataDoc.editorsByDocIdUserId[
            docId
        ] || {})[nextOwnerId];
        const {
            data,
        }: {
            data: IDataDocEditor;
        } = await ds.save(`/datadoc/${docId}/owner/`, {
            current_owner_id: currentOwnerId,
            next_owner_id: nextOwnerEditor.id,
            originator: dataDocSocket.getSocketId(),
        });
        dispatch({
            type: '@@dataDoc/REMOVE_DATA_DOC_EDITOR',
            payload: {
                docId: docId,
                uid: nextOwnerId,
            },
        });
        dispatch({
            type: '@@dataDoc/UPDATE_DATA_DOC_FIELD',
            payload: {
                docId: docId,
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

export function fetchDataDoc(docId: number): ThunkResult<Promise<{}>> {
    return async (dispatch) => {
        const { data: rawDataDoc } = await ds.fetch(`/datadoc/${docId}/`);

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

export function cloneDataDoc(docId: number): ThunkResult<Promise<IDataDoc>> {
    return async (dispatch) => {
        const { data: rawDataDoc } = await ds.save(`/datadoc/${docId}/clone/`);
        const { dataDoc, dataDocCellById } = normalizeRawDataDoc(rawDataDoc);

        dispatch(receiveDataDoc(dataDoc, dataDocCellById));
        return dataDoc;
    };
}

export function createDataDoc(
    cells: Array<Partial<IDataCell>> = []
): ThunkResult<Promise<IDataDoc>> {
    return async (dispatch, getState) => {
        const state = getState();

        const { data: rawDataDoc } = await ds.save('/datadoc/', {
            title: '',
            environment_id: state.environment.currentEnvironmentId,
            cells,
        });
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

        const { data: rawDataDoc } = await ds.save('/datadoc/from_execution/', {
            title: '',
            environment_id: state.environment.currentEnvironmentId,
            execution_id: queryExecutionId,
            engine_id: engineId,
            query_string: queryString,
        });
        const { dataDoc, dataDocCellById } = normalizeRawDataDoc(rawDataDoc);
        dispatch(receiveDataDoc(dataDoc, dataDocCellById));

        return dataDoc;
    };
}

export function deleteDataDoc(docId: number): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        try {
            await ds.delete(`/datadoc/${docId}/`);
            dispatch({
                type: '@@dataDoc/REMOVE_DATA_DOC',
                payload: {
                    docId,
                },
            });
        } catch (error) {
            // dispatch({
            //     type: 'ERROR',
            //     error,
            // });
        }
    };
}

export function fetchUnModifiedDataCellByQueryExecutionIfNeeded({
    id,
}): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await ds.fetch(`/query_execution/${id}/cell/`);
        const normalizedData = normalize(data, dataDocCellSchema);
        const { dataDocCell: dataDocCellById = {} } = normalizedData.entities;

        dispatch({
            type: '@@dataDoc/RECEIVE_DATA_CELL',
            payload: {
                dataDocCellById,
            },
        });

        return data;
    };
}

export function insertDataDocCell(
    docId: number,
    index: number,
    cellType: CELL_TYPE,
    context: string | ContentState,
    meta: {}
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

export function deleteDataDocCell(docId: number, index: number): Promise<{}> {
    return dataDocSocket.deleteDataCell(docId, index);
}

export function moveDataDocCursor(
    docId: number,
    cellId?: number
): Promise<any> {
    return dataDocSocket.moveDataDocCursor(docId, cellId);
}

export function moveDataDocCell(
    docId: number,
    fromIndex: number,
    toIndex: number
): Promise<any> {
    return dataDocSocket.moveDataDocCell(docId, fromIndex, toIndex);
}

export function pasteDataCell(
    cellId: number,
    cut: boolean,
    docId: number,
    index: number
): Promise<any> {
    return dataDocSocket.pasteDataCell(cellId, cut, docId, index);
}

export function updateDataDocCell(
    docId: number,
    id: number,
    context?: string | ContentState,
    meta?: {}
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
                onSave.bind(null, false); // on failure, we pretend it saved!
                throw e; // keep it up with the rejection chain
            });
    };
}

export function updateDataDocField(
    docId: number,
    fieldName: string,
    fieldVal: any
): ThunkResult<Promise<void>> {
    return (dispatch, getState) => {
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
        const onSave = (start) => {
            dispatch(makeSaveDataDocPromise(start, docId, saveKey, completeAt));
        };

        onSave(true);
        return dataDocSaveManager
            .saveDataDocField(docId, fieldName, fieldVal, saveTitleTimeout)
            .then(
                onSave.bind(null, false),
                onSave.bind(null, false) // on failure, we pretend it saved!
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
    return async (dispatch, getState) => {
        const userId = getState().user.myUserInfo.uid;
        await ds.save(`/favorite_data_doc/${userId}/${docId}/`);
        dispatch({
            type: '@@dataDoc/RECEIVE_PINNED_DATA_DOC_ID',
            payload: {
                docId,
            },
        });
    };
}

export function unfavoriteDataDoc(docId: number): ThunkResult<void> {
    return async (dispatch, getState) => {
        const userId = getState().user.myUserInfo.uid;
        await ds.delete(`/favorite_data_doc/${userId}/${docId}/`);
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
        const {
            data,
        }: {
            data: IDataDocEditor[];
        } = await ds.fetch(`/datadoc/${docId}/editor/`);

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
    read: boolean,
    write: boolean
): ThunkResult<Promise<IDataDocEditor>> {
    return async (dispatch) => {
        const {
            data,
        }: {
            data: IDataDocEditor;
        } = await ds.save(`/datadoc/${docId}/editor/${uid}/`, {
            read,
            write,
            originator: dataDocSocket.getSocketId(),
        });

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
            } = await ds.update(`/datadoc_editor/${editor.id}/`, {
                read,
                write,
                originator: dataDocSocket.getSocketId(),
            });

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
            await ds.delete(`/datadoc_editor/${editor.id}/`, {
                originator: dataDocSocket.getSocketId(),
            });

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
