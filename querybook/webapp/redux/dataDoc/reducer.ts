import { produce } from 'immer';
import moment from 'moment';
import { combineReducers } from 'redux';

import { IDataCell } from 'const/datadoc';
import { arrayMove, arrayGroupByField } from 'lib/utils';
import { IDataDocState, DataDocAction } from './types';
import { EnvironmentAction } from 'redux/environment/types';

const initialState: Readonly<IDataDocState> = {
    dataDocById: {},
    dataDocCellById: {},
    favoriteDataDocIds: [],
    recentDataDocIds: [],

    loadedEnvironmentFilterMode: {},
    docIdToQueryExecution: {},
    dataDocSavePromiseById: {},

    sessionByDocId: {},
    editorsByDocIdUserId: {},
    accessRequestsByDocIdUserId: {},
};

function loadedEnvironmentFilterModeReducer(
    state = initialState.loadedEnvironmentFilterMode,
    action: DataDocAction | EnvironmentAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_DOCS': {
                const { environmentId, filterMode } = action.payload;
                if (environmentId == null) {
                    return;
                }
                draft[environmentId] = draft[environmentId] || {};
                if (filterMode == null) {
                    return;
                }
                draft[environmentId][filterMode] = true;
                return;
            }
            case '@@environment/SET_ENVIRONMENT_BY_ID': {
                const { id: currentEnvId } = action.payload;
                for (const envId of Object.keys(draft).map(Number)) {
                    if (envId !== currentEnvId) {
                        delete draft[envId];
                    }
                }
                return;
            }
        }
    });
}

function removeDocFromCells(
    dataDocCellById: Record<number, IDataCell>,
    docId: number
) {
    return Object.values(dataDocCellById).reduce((hash, cell) => {
        if (cell.docId !== docId) {
            hash[cell.id] = cell;
        }
        return hash;
    }, {});
}

function dataDocCellByIdReducer(
    state = initialState.dataDocCellById,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_DOC': {
                const { dataDoc, dataDocCellById } = action.payload;
                return {
                    ...removeDocFromCells(state, dataDoc.id),
                    ...dataDocCellById,
                };
            }
            case '@@dataDoc/REMOVE_DATA_DOC': {
                const { docId } = action.payload;
                return removeDocFromCells(state, docId);
            }
            case '@@dataDoc/UPDATE_DATA_DOC_CELL':
            case '@@dataDoc/INSERT_DATA_DOC_CELL': {
                const { cell } = action.payload;
                draft[cell.id] = cell;
                return;
            }
            case '@@dataDoc/UPDATE_DATA_DOC_CELL_DATA': {
                const { cellId } = action.payload;
                if (action.payload.context != null) {
                    draft[cellId].context = action.payload.context;
                }
                if (action.payload.meta != null) {
                    draft[cellId].meta = action.payload.meta;
                }

                return;
            }
            default: {
                return state;
            }
        }
    });
}

function dataDocCellsArrayHelper(cells: number[] = [], action: DataDocAction) {
    switch (action.type) {
        case '@@dataDoc/INSERT_DATA_DOC_CELL': {
            const {
                cell: { id },
                index,
            } = action.payload;
            const filteredCells = cells.filter((cell) => cell !== id);
            return [
                ...filteredCells.slice(0, index),
                id,
                ...filteredCells.slice(index),
            ];
        }
        case '@@dataDoc/DELETE_DATA_DOC_CELL': {
            const { cellId } = action.payload;
            return cells.filter((id) => id !== cellId);
        }
        case '@@dataDoc/MOVE_DATA_DOC_CELL': {
            const { fromIndex, toIndex } = action.payload;
            return arrayMove(cells, fromIndex, toIndex);
        }
        default: {
            return cells;
        }
    }
}

function dataDocByIdReducer(
    state = initialState.dataDocById,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_DOCS': {
                for (const [docId, dataDoc] of Object.entries(
                    action.payload.dataDocById
                )) {
                    draft[docId] = {
                        ...draft[docId],
                        ...dataDoc,
                    };
                }
                return;
            }
            case '@@dataDoc/RECEIVE_DATA_DOC_UPDATE': {
                const { dataDoc } = action.payload;
                draft[dataDoc.id] = {
                    ...draft[dataDoc.id],
                    ...dataDoc,
                };

                return;
            }
            case '@@dataDoc/RECEIVE_DATA_DOC': {
                const { dataDoc } = action.payload;
                draft[dataDoc.id] = dataDoc;

                return;
            }
            case '@@dataDoc/REMOVE_DATA_DOC': {
                const { docId } = action.payload;
                delete draft[docId];

                return;
            }
            case '@@dataDoc/INSERT_DATA_DOC_CELL':
            case '@@dataDoc/DELETE_DATA_DOC_CELL':
            case '@@dataDoc/MOVE_DATA_DOC_CELL': {
                const docId = action.payload.docId;

                const dataDoc = draft[docId];
                dataDoc.cells = dataDocCellsArrayHelper(
                    draft[docId].cells,
                    action
                );
                dataDoc.updated_at = moment().unix();
                return;
            }
            case '@@dataDoc/UPDATE_DATA_DOC_FIELD': {
                const { docId, fieldName, fieldVal } = action.payload;
                const dataDoc = draft[docId];
                dataDoc[fieldName] = fieldVal;
                dataDoc.updated_at = moment().unix();
                return;
            }
            case '@@dataDoc/SAVE_DATA_DOC_END': {
                draft[action.payload.docId].updated_at = moment().unix();
                return;
            }
        }
    });
}

function favoriteDataDocIdsReducer(
    state = initialState.favoriteDataDocIds,
    action: DataDocAction
) {
    switch (action.type) {
        case '@@dataDoc/RECEIVE_DATA_DOCS': {
            const { filterMode, dataDocById } = action.payload;
            if (filterMode === 'favorite') {
                return Object.keys(dataDocById).map(Number);
            }
            return state;
        }
        case '@@dataDoc/RECEIVE_PINNED_DATA_DOC_ID': {
            const { docId } = action.payload;
            if (!state.includes(docId)) {
                return [...state, docId];
            }
            return state;
        }
        case '@@dataDoc/REMOVE_PINNED_DATA_DOC_ID': {
            const { docId } = action.payload;

            return state.filter((id) => id !== docId);
        }
        default: {
            return state;
        }
    }
}

function recentDataDocIdsReducer(
    state = initialState.recentDataDocIds,
    action: DataDocAction
) {
    switch (action.type) {
        case '@@dataDoc/RECEIVE_DATA_DOCS': {
            const { filterMode, dataDocById } = action.payload;
            if (filterMode === 'recent') {
                return Object.keys(dataDocById).map(Number);
            }
            return state;
        }
        case '@@dataDoc/RECEIVE_DATA_DOC': {
            const {
                dataDoc: { id },
            } = action.payload;
            return [id, ...state.filter((docId) => docId !== id)];
        }
        default: {
            return state;
        }
    }
}

function docIdToQueryExecutionReducer(
    state = initialState.docIdToQueryExecution,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/UPDATE_DATA_DOC_POLLING': {
                const { docId, queryExecutionId, polling } = action.payload;

                if (!(docId in draft)) {
                    draft[docId] = {};
                }

                if (polling) {
                    draft[docId][queryExecutionId] = true;
                } else {
                    delete draft[docId][queryExecutionId];
                }

                return;
            }
        }
    });
}

function dataDocSavePromiseByIdReducer(
    state = initialState.dataDocSavePromiseById,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/SAVE_DATA_DOC_START': {
                const { docId, key, completeAt } = action.payload;

                if (!(docId in draft)) {
                    draft[docId] = {
                        itemToSave: {},
                        lastUpdatedAt: null,
                    };
                }

                draft[docId].itemToSave[key] = completeAt;
                return;
            }
            case '@@dataDoc/SAVE_DATA_DOC_END': {
                const { docId, key, completeAt } = action.payload;

                if (docId in draft && key in draft[docId].itemToSave) {
                    if (draft[docId].itemToSave[key] <= completeAt) {
                        delete draft[docId].itemToSave[key];
                    }
                    draft[docId].lastUpdatedAt = completeAt;
                }

                return;
            }
            case '@@dataDoc/SAVE_DATA_DOC_CLEAR': {
                const { docId } = action.payload;
                if (docId in draft) {
                    draft[docId].itemToSave = {};
                }

                return;
            }
        }
    });
}

function sessionByDocIdReducer(
    state = initialState.sessionByDocId,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_DOC_SESSIONS': {
                const { sidToCellId, sidToUid, docId } = action.payload;
                draft[docId] = Object.entries(sidToUid)
                    .map(([sid, uid]) => {
                        const cellId = sidToCellId[sid];
                        return {
                            sid,
                            uid,
                            cellId,
                        };
                    })
                    .reduce((hash, { sid, uid, cellId }) => {
                        hash[sid] = {
                            uid,
                            cellId,
                        };
                        return hash;
                    }, {});
                return;
            }
            case '@@dataDoc/MOVE_DATA_DOC_CURSOR': {
                const { docId, sid, cellId } = action.payload;

                if (sid in draft[docId]) {
                    draft[docId][sid].cellId = cellId;
                }
                return;
            }
            case '@@dataDoc/RECEIVE_DATA_DOC_USER': {
                const { sid, uid, docId } = action.payload;
                if (docId in draft) {
                    draft[docId][sid] = {
                        ...(draft[docId][sid] || {}),
                        uid,
                    };
                }

                return;
            }
            case '@@dataDoc/REMOVE_DATA_DOC_USER': {
                const { sid, docId } = action.payload;
                if (sid in (draft[docId] || {})) {
                    delete draft[docId][sid];
                }
                return;
            }
        }
    });
}

function accessRequestsByDocIdUserIdReducer(
    state = initialState.accessRequestsByDocIdUserId,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUESTS': {
                const { docId, requests } = action.payload;
                draft[docId] = arrayGroupByField(requests, 'uid');
                return;
            }
            case '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUEST': {
                const { docId, request } = action.payload;
                if (!(docId in draft)) {
                    draft[docId] = {};
                }
                draft[docId][request.uid] = request;
                return;
            }
            case '@@dataDoc/REMOVE_DATA_DOC_ACCESS_REQUEST': {
                const { docId, uid } = action.payload;
                if (docId in draft && uid in draft[docId]) {
                    delete draft[docId][uid];
                }
                return;
            }
        }
    });
}

function editorsByDocIdUserIdReducer(
    state = initialState.editorsByDocIdUserId,
    action: DataDocAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_DOC_EDITORS': {
                const { docId, editors } = action.payload;
                draft[docId] = arrayGroupByField(editors, 'uid');
                return;
            }
            case '@@dataDoc/RECEIVE_DATA_DOC_EDITOR': {
                const { docId, editor } = action.payload;
                if (!(docId in draft)) {
                    draft[docId] = {};
                }
                draft[docId][editor.uid] = editor;
                return;
            }
            case '@@dataDoc/REMOVE_DATA_DOC_EDITOR': {
                const { docId, uid } = action.payload;
                if (docId in draft && uid in draft[docId]) {
                    delete draft[docId][uid];
                }

                return;
            }
        }
    });
}

export default combineReducers({
    dataDocById: dataDocByIdReducer,
    dataDocCellById: dataDocCellByIdReducer,
    loadedEnvironmentFilterMode: loadedEnvironmentFilterModeReducer,
    favoriteDataDocIds: favoriteDataDocIdsReducer,
    recentDataDocIds: recentDataDocIdsReducer,

    docIdToQueryExecution: docIdToQueryExecutionReducer,
    dataDocSavePromiseById: dataDocSavePromiseByIdReducer,
    sessionByDocId: sessionByDocIdReducer,
    editorsByDocIdUserId: editorsByDocIdUserIdReducer,
    accessRequestsByDocIdUserId: accessRequestsByDocIdUserIdReducer,
});
