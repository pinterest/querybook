import { ContentState } from 'draft-js';
import { stateFromHTML } from 'draft-js-import-html';
import { normalize, schema } from 'normalizr';

import { IAccessRequest } from 'const/accessRequest';
import {
    BoardItemType,
    IBoard,
    IBoardBase,
    IBoardEditor,
    IBoardItem,
    IBoardRaw,
} from 'const/board';
import { IQueryExecution } from 'const/queryExecution';
import {
    Permission,
    permissionToReadWrite,
} from 'lib/data-doc/datadoc-permission';
import { convertContentStateToHTML } from 'lib/richtext/serialize';
import { arrayGroupByField } from 'lib/utils';
import { receiveDataDocs } from 'redux/dataDoc/action';
import { receiveDataTable } from 'redux/dataSources/action';
import { receiveQueryExecution } from 'redux/queryExecutions/action';
import { Dispatch } from 'redux/store/types';
import {
    BoardAccessRequestResource,
    BoardEditorResource,
    BoardResource,
} from 'resource/board';

import {
    IReceiveBoardAccessRequestsAction,
    IReceiveBoardsAction,
    ThunkResult,
} from './types';

export const dataDocSchema = new schema.Entity('dataDoc');
export const tableSchema = new schema.Entity('dataTable');
export const childBoardSchema = new schema.Entity('board');
export const querySchema = new schema.Entity('query');
export const boardItemSchema = new schema.Entity('boardItem');
export const boardSchema = new schema.Entity('board', {
    docs: [dataDocSchema],
    tables: [tableSchema],
    boards: [childBoardSchema],
    qureies: [querySchema],
    items: [boardItemSchema],
});

function normalizeBoard(rawBoard: IBoardRaw) {
    const normalizedData = normalize(rawBoard, boardSchema);
    const parentBoard = normalizedData.entities.board[normalizedData.result];
    const {
        dataTable: dataTableById = {},
        dataDoc: dataDocById = {},
        board: boardById = {},
        query: queryById = {},
        boardItem: boardItemById = {},
    } = normalizedData.entities;

    return {
        board: parentBoard,
        dataTableById,
        dataDocById,
        boards: Object.values(boardById),
        queryById,
        boardItemById,
    };
}

function receiveBoardWithItems(dispatch: Dispatch, rawBoard: IBoardRaw) {
    const {
        board,
        dataTableById,
        dataDocById,
        boards,
        queryById,
        boardItemById,
    } = normalizeBoard(rawBoard);

    dispatch(receiveDataDocs(dataDocById, [], null, null));
    dispatch(receiveDataTable({}, dataTableById, {}, {}));
    dispatch(receiveBoards(boards as IBoardBase[]));
    Object.values(queryById).forEach((query) =>
        dispatch(receiveQueryExecution(query as IQueryExecution))
    );

    Object.keys(boardItemById).forEach((boardItemId) => {
        boardItemById[boardItemId] = {
            ...boardItemById[boardItemId],
            description: stateFromHTML(
                boardItemById[boardItemId].description || ''
            ),
        };
    });

    dispatch({
        type: '@@board/RECEIVE_BOARD_WITH_ITEMS',
        payload: {
            board: {
                ...board,
                description: stateFromHTML(board.description || ''),
            },
            boardItemById,
        },
    });
}

function receiveBoards(boards: IBoardBase[]): IReceiveBoardsAction {
    const boardById: Record<string, IBoard> = arrayGroupByField(
        boards.map((board) => ({
            ...board,
            description: stateFromHTML(board.description || ''),
        }))
    );
    return {
        type: '@@board/RECEIVE_BOARDS',
        payload: {
            boardById,
        },
    };
}

export function fetchBoards(
    filterStr: string = ''
): ThunkResult<Promise<IBoardBase[]>> {
    return async (dispatch, getState) => {
        const state = getState();
        const rawBoards = (
            await BoardResource.getAll(
                state.environment.currentEnvironmentId,
                filterStr
            )
        ).data;
        dispatch(receiveBoards(rawBoards));
        return rawBoards;
    };
}

export function fetchBoard(id: number): ThunkResult<Promise<IBoardRaw>> {
    return (dispatch, getState) => {
        const state = getState();
        return BoardResource.get(
            id,
            state.environment.currentEnvironmentId
        ).then(({ data: board }) => {
            receiveBoardWithItems(dispatch, board);
            return board;
        });
    };
}

export function fetchBoardIfNeeded(id: number): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const state = getState();
        if (!state.board.boardById[id]?.items) {
            return dispatch(fetchBoard(id));
        }
    };
}

export function createBoard(
    name: string,
    description: ContentState,
    isPublic: boolean
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch, getState) => {
        const state = getState();
        const board = (
            await BoardResource.create(
                name,
                state.environment.currentEnvironmentId,
                convertContentStateToHTML(description),
                isPublic
            )
        ).data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function updateBoard(
    id: number,
    name: string,
    isPublic?: boolean,
    description?: ContentState
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch) => {
        const fields = { name };
        if (description) {
            fields['description'] = convertContentStateToHTML(description);
        }
        if (isPublic !== null) {
            fields['public'] = isPublic;
        }
        const board = (await BoardResource.update(id, fields)).data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function deleteBoard(id: number): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await BoardResource.delete(id);
        dispatch({
            type: '@board/REMOVE_BOARD',
            payload: {
                id,
            },
        });
    };
}

export function addBoardItem(
    boardId: number,
    itemType: BoardItemType,
    itemId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: boardItem } = await BoardResource.addItem(
            boardId,
            itemType,
            itemId
        );

        dispatch({
            type: '@@board/RECEIVE_BOARD_ITEM',
            payload: {
                boardItem: {
                    ...boardItem,
                    description: stateFromHTML(boardItem.description || ''),
                } as unknown as IBoardItem,
                boardId,
                itemType,
                itemId,
            },
        });
    };
}

export function moveBoardItem(
    boardId: number,
    fromIndex: number,
    toIndex: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await BoardResource.moveItem(boardId, fromIndex, toIndex);

        dispatch({
            type: '@@board/MOVE_BOARD_ITEM',
            payload: {
                fromIndex,
                toIndex,
                boardId,
            },
        });
    };
}

export function deleteBoardItem(
    boardId: number,
    itemType: BoardItemType,
    itemId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await BoardResource.deleteItem(boardId, itemType, itemId);
        dispatch({
            type: '@@board/REMOVE_BOARD_ITEM',
            payload: {
                boardId,
                itemId,
                itemType,
            },
        });
    };
}

export function updateBoardItemDescription(
    boardItemId: number,
    updatedDescription: ContentState
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: boardItem } = await BoardResource.updateItemFields(
            boardItemId,
            { description: convertContentStateToHTML(updatedDescription) }
        );
        dispatch({
            type: '@@board/UPDATE_BOARD_ITEM_DESCRIPTION',
            payload: {
                boardItem: {
                    ...boardItem,
                    description: stateFromHTML(boardItem.description || ''),
                } as unknown as IBoardItem,
            },
        });
    };
}

export function updateBoardItemMeta(
    boardItemId: number,
    updatedMeta: Record<string, any>
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: boardItem } = await BoardResource.updateItemFields(
            boardItemId,
            { meta: updatedMeta }
        );
        dispatch({
            type: '@@board/UPDATE_BOARD_ITEM_DESCRIPTION',
            payload: {
                boardItem: {
                    ...boardItem,
                    description: stateFromHTML(boardItem.description || ''),
                } as unknown as IBoardItem,
            },
        });
    };
}

export function getBoardEditors(
    boardId: number
): ThunkResult<Promise<IBoardEditor[]>> {
    return async (dispatch) => {
        const { data } = await BoardEditorResource.get(boardId);

        dispatch({
            type: '@@board/RECEIVE_BOARD_EDITORS',
            payload: {
                boardId,
                editors: data,
            },
        });

        return data;
    };
}

export function addBoardEditor(
    boardId: number,
    uid: number,
    permission: Permission
): ThunkResult<Promise<IBoardEditor>> {
    return async (dispatch, getState) => {
        const request = (getState().board.accessRequestsByBoardIdUserId[
            boardId
        ] || {})[uid];
        const { read, write } = permissionToReadWrite(permission);
        const { data } = await BoardEditorResource.create(
            boardId,
            uid,
            read,
            write
        );
        if (request) {
            dispatch({
                type: '@@board/REMOVE_BOARD_ACCESS_REQUEST',
                payload: {
                    boardId,
                    uid,
                },
            });
        }
        dispatch({
            type: '@@board/RECEIVE_BOARD_EDITOR',
            payload: {
                boardId,
                editor: data,
            },
        });

        return data;
    };
}

export function updateBoardEditor(
    boardId: number,
    uid: number,
    read: boolean,
    write: boolean
): ThunkResult<Promise<IBoardEditor>> {
    return async (dispatch, getState) => {
        const editor = (getState().board.editorsByBoardIdUserId[boardId] || {})[
            uid
        ];
        if (editor) {
            const { data } = await BoardEditorResource.update(
                editor.id,
                read,
                write
            );

            dispatch({
                type: '@@board/RECEIVE_BOARD_EDITOR',
                payload: {
                    boardId,
                    editor: data,
                },
            });
            return data;
        }
    };
}

export function deleteBoardEditor(
    boardId: number,
    uid: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const editor = (getState().board.editorsByBoardIdUserId[boardId] || {})[
            uid
        ];
        if (editor) {
            await BoardEditorResource.delete(editor.id);
            dispatch({
                type: '@@board/REMOVE_BOARD_EDITOR',
                payload: {
                    boardId,
                    uid,
                },
            });
        }
    };
}

export function receiveBoardAccessRequests(
    boardId: number,
    requests: IAccessRequest[]
): IReceiveBoardAccessRequestsAction {
    return {
        type: '@@board/RECEIVE_BOARD_ACCESS_REQUESTS',
        payload: {
            boardId,
            requests,
        },
    };
}

export function fetchBoardAccessRequests(
    boardId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: boardAccessRequests } =
            await BoardAccessRequestResource.get(boardId);
        dispatch(receiveBoardAccessRequests(boardId, boardAccessRequests));
    };
}

export function addBoardAccessRequest(
    boardId: number
): ThunkResult<Promise<IAccessRequest>> {
    return async (dispatch) => {
        const { data } = await BoardAccessRequestResource.create(boardId);
        if (data != null) {
            dispatch({
                type: '@@board/RECEIVE_BOARD_ACCESS_REQUEST',
                payload: {
                    boardId,
                    request: data,
                },
            });
        }
        return data;
    };
}

export function rejectBoardAccessRequest(
    boardId: number,
    uid: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const accessRequest = (getState().board.accessRequestsByBoardIdUserId[
            boardId
        ] || {})[uid];
        if (accessRequest) {
            await BoardAccessRequestResource.delete(boardId, uid);
            dispatch({
                type: '@@board/REMOVE_BOARD_ACCESS_REQUEST',
                payload: {
                    boardId,
                    uid,
                },
            });
        }
    };
}

export function updateBoardOwner(
    boardId: number,
    nextOwnerId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const nextOwnerEditor = (getState().board.editorsByBoardIdUserId[
            boardId
        ] || {})[nextOwnerId];
        const { data } = await BoardResource.updateOwner(
            boardId,
            nextOwnerEditor.id
        );
        dispatch({
            type: '@@board/REMOVE_BOARD_EDITOR',
            payload: {
                boardId,
                uid: nextOwnerId,
            },
        });
        dispatch({
            type: '@@board/UPDATE_BOARD_FIELD',
            payload: {
                boardId,
                fieldName: 'owner_uid',
                fieldVal: nextOwnerId,
            },
        });
        dispatch({
            type: '@@board/RECEIVE_BOARD_EDITOR',
            payload: {
                boardId: data['board_id'],
                editor: data,
            },
        });
    };
}
