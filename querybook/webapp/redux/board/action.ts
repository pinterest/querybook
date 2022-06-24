import { ContentState } from 'draft-js';
import { stateFromHTML } from 'draft-js-import-html';
import { normalize, schema } from 'normalizr';

import {
    BoardItemType,
    IBoard,
    IBoardBase,
    IBoardItem,
    IBoardRaw,
} from 'const/board';
import { convertContentStateToHTML } from 'lib/richtext/serialize';
import { arrayGroupByField } from 'lib/utils';
import { receiveDataDocs } from 'redux/dataDoc/action';
import { receiveDataTable } from 'redux/dataSources/action';
import { Dispatch } from 'redux/store/types';
import { BoardResource } from 'resource/board';

import { IReceiveBoardsAction, ThunkResult } from './types';

export const dataDocSchema = new schema.Entity('dataDoc');
export const tableSchema = new schema.Entity('dataTable');
export const boardSchema = new schema.Entity('board');
export const boardItemSchema = new schema.Entity('boardItem');
export const parentBoardSchema = new schema.Entity('board', {
    docs: [dataDocSchema],
    tables: [tableSchema],
    boards: [boardSchema],
    items: [boardItemSchema],
});

function normalizeBoard(rawBoard: IBoardRaw) {
    const normalizedData = normalize(rawBoard, parentBoardSchema);
    const parentBoard = normalizedData.entities.board[normalizedData.result];
    const {
        dataTable: dataTableById = {},
        dataDoc: dataDocById = {},
        board: boardById = {},
        boardItem: boardItemById = {},
    } = normalizedData.entities;

    return {
        board: parentBoard,
        dataTableById,
        dataDocById,
        boards: Object.values(boardById),
        boardItemById,
    };
}

function receiveBoardWithItems(dispatch: Dispatch, rawBoard: IBoardRaw) {
    const { board, dataTableById, dataDocById, boards, boardItemById } =
        normalizeBoard(rawBoard);

    dispatch(receiveDataDocs(dataDocById, [], null, null));
    dispatch(receiveDataTable({}, dataTableById, {}, {}));
    dispatch(receiveBoards(boards as IBoardBase[]));

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
    return (dispatch) =>
        BoardResource.get(id).then(({ data: board }) => {
            receiveBoardWithItems(dispatch, board);
            return board;
        });
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
    isPublic: boolean,
    description: ContentState
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch) => {
        const board = (
            await BoardResource.update(id, {
                name,
                description: convertContentStateToHTML(description),
                public: isPublic,
            })
        ).data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function updateBoardDescription(
    id: number,
    description: ContentState
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch) => {
        const board = (
            await BoardResource.update(id, {
                description: convertContentStateToHTML(description),
            })
        ).data;
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
    boardId: number,
    boardItemId: number,
    updatedDescription: ContentState
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data: boardItem } = await BoardResource.updateItemDescription(
            boardId,
            boardItemId,
            convertContentStateToHTML(updatedDescription)
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

export function setCurrentBoardId(boardId: number): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        dispatch({
            type: '@@board/SET_CURRENT_BOARD_ID',
            payload: {
                boardId,
            },
        });
    };
}
