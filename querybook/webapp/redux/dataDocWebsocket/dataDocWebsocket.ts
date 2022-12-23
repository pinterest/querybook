import { IAccessRequest } from 'const/accessRequest';
import { IDataDocEditor } from 'const/datadoc';
import dataDocSocket, {
    IDataDocSocketEvent,
} from 'lib/data-doc/datadoc-socketio';
import { isEmpty, isEqual } from 'lodash';
import {
    deserializeCell,
    fetchDataDoc,
    normalizeRawDataDoc,
    receiveDataDoc,
} from 'redux/dataDoc/action';
import { ThunkResult } from 'redux/dataDoc/types';
import { receiveQueryExecution } from 'redux/queryExecutions/action';
import { ThunkDispatch as QueryExecutionDispatch } from 'redux/queryExecutions/types';

export function openDataDoc(docId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const dataDocEventMap: IDataDocSocketEvent = {
            receiveDataDoc: {
                resolve: (rawDataDoc) => {
                    const { dataDoc, dataDocCellById } =
                        normalizeRawDataDoc(rawDataDoc);
                    dispatch(receiveDataDoc(dataDoc, dataDocCellById));
                },
            },

            receiveDataDocEditors: {
                resolve: (editors) => {
                    dispatch({
                        type: '@@dataDoc/RECEIVE_DATA_DOC_EDITORS',
                        payload: {
                            docId,
                            editors,
                        },
                    });
                },
            },

            receiveDataDocAccessRequests: {
                resolve: (requests) => {
                    dispatch({
                        type: '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUESTS',
                        payload: {
                            docId,
                            requests,
                        },
                    });
                },
            },

            updateDataDoc: {
                resolve: (rawDataDoc, isSameOrigin) => {
                    if (!isSameOrigin) {
                        const { dataDoc } = normalizeRawDataDoc(rawDataDoc);
                        dispatch({
                            type: '@@dataDoc/RECEIVE_DATA_DOC_UPDATE',
                            payload: {
                                dataDoc,
                            },
                        });
                    } else {
                        // Even if it is sameOrigin, dervied fields also needs to be updated
                        const derviedFields = ['meta_variables'];
                        const docId = rawDataDoc.id;

                        dispatch((thunkDispatch, getState) => {
                            const state = getState();
                            const oldDoc =
                                state.dataDoc.dataDocById[docId] ?? {};

                            // make a partial dataDoc with all the dervied fields
                            const newDocFields = {};
                            for (const field of derviedFields) {
                                if (
                                    !isEqual(oldDoc[field], rawDataDoc[field])
                                ) {
                                    newDocFields[field] = rawDataDoc[field];
                                }
                            }

                            if (!isEmpty(newDocFields)) {
                                thunkDispatch({
                                    type: '@@dataDoc/RECEIVE_DATA_DOC_UPDATE',
                                    payload: {
                                        dataDoc: {
                                            id: docId,
                                            ...newDocFields,
                                        },
                                    },
                                });
                            }
                        });
                    }
                },
            },
            updateDataCell: {
                resolve: (rawDataCell, isSameOrigin) => {
                    if (!isSameOrigin) {
                        const cell = deserializeCell(rawDataCell);

                        dispatch({
                            type: '@@dataDoc/UPDATE_DATA_DOC_CELL_DATA',
                            payload: {
                                cellId: cell.id,
                                context: cell.context,
                                meta: cell.meta,
                            },
                        });
                    }
                },
            },

            insertDataCell: {
                resolve: (index, rawDataCell) => {
                    dispatch({
                        type: '@@dataDoc/INSERT_DATA_DOC_CELL',
                        payload: {
                            docId,
                            cell: deserializeCell(rawDataCell),
                            index,
                        },
                    });
                },
            },

            deleteDataCell: {
                resolve: (cellId) => {
                    dispatch({
                        type: '@@dataDoc/DELETE_DATA_DOC_CELL',
                        payload: {
                            docId,
                            cellId,
                        },
                    });
                },
            },

            moveDataCell: {
                resolve: (fromIndex, toIndex) => {
                    dispatch({
                        type: '@@dataDoc/MOVE_DATA_DOC_CELL',
                        payload: {
                            docId,
                            fromIndex,
                            toIndex,
                        },
                    });
                },
            },

            updateDataDocUsers: {
                resolve: (sidToUid, sidToCellId) => {
                    dispatch({
                        type: '@@dataDoc/RECEIVE_DATA_DOC_SESSIONS',
                        payload: {
                            docId,
                            sidToUid,
                            sidToCellId,
                        },
                    });
                },
            },

            updateDataDocEditor: {
                resolve: (
                    editorDocId: number,
                    uid: number,
                    editor: IDataDocEditor,
                    isSameOrigin: boolean
                ) => {
                    if (!isSameOrigin) {
                        if (editor) {
                            dispatch({
                                type: '@@dataDoc/RECEIVE_DATA_DOC_EDITOR',
                                payload: {
                                    docId: editorDocId,
                                    editor,
                                },
                            });
                        } else {
                            dispatch({
                                type: '@@dataDoc/REMOVE_DATA_DOC_EDITOR',
                                payload: {
                                    docId: editorDocId,
                                    uid,
                                },
                            });
                        }
                    }
                },
            },

            updateDataDocAccessRequest: {
                resolve: (
                    requestDocId: number,
                    uid: number,
                    request: IAccessRequest,
                    isSameOrigin: boolean
                ) => {
                    if (!isSameOrigin) {
                        if (request) {
                            dispatch({
                                type: '@@dataDoc/RECEIVE_DATA_DOC_ACCESS_REQUEST',
                                payload: {
                                    docId: requestDocId,
                                    request,
                                },
                            });
                        } else {
                            dispatch({
                                type: '@@dataDoc/REMOVE_DATA_DOC_ACCESS_REQUEST',
                                payload: {
                                    docId: requestDocId,
                                    uid,
                                },
                            });
                        }
                    }
                },
            },

            receiveQueryExecution: {
                resolve: (queryExecution, dataCellId, isSameOrigin) => {
                    if (!isSameOrigin) {
                        (dispatch as QueryExecutionDispatch)(
                            receiveQueryExecution(queryExecution, dataCellId)
                        );
                    }
                },
            },

            moveDataDocCursor: {
                resolve: (sid, cellId) => {
                    dispatch({
                        type: '@@dataDoc/MOVE_DATA_DOC_CURSOR',
                        payload: {
                            docId,
                            sid,
                            cellId,
                        },
                    });
                },
            },

            receiveDataDocUser: {
                resolve: (add, sid, uid) => {
                    dispatch(
                        add
                            ? {
                                  type: '@@dataDoc/RECEIVE_DATA_DOC_USER',
                                  payload: {
                                      sid,
                                      uid,
                                      docId,
                                  },
                              }
                            : {
                                  type: '@@dataDoc/REMOVE_DATA_DOC_USER',
                                  payload: {
                                      sid,
                                      uid,
                                      docId,
                                  },
                              }
                    );
                },
            },
        };

        await dispatch(fetchDataDoc(docId));
        return dataDocSocket.addDataDoc(docId, dataDocEventMap);
    };
}

export function closeDataDoc(docId: number): ThunkResult<void> {
    return () => {
        dataDocSocket.removeDataDoc(docId);
    };
}
