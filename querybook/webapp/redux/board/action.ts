import { normalize, schema } from 'normalizr';
import { ThunkResult, IReceiveBoardsAction } from './types';
import { arrayGroupByField } from 'lib/utils';
import {
    IBoardWithItemIds,
    IBoard,
    IBoardRaw,
    BoardItemType,
    IBoardUpdatableField,
} from 'const/board';
import { Dispatch } from 'redux/store/types';
import { receiveDataDocs } from 'redux/dataDoc/action';
import { receiveDataTable } from 'redux/dataSources/action';
import { BoardResource } from 'resource/board';

export const dataDocSchema = new schema.Entity('dataDoc');
export const tableSchema = new schema.Entity('dataTable');
export const boardItemSchema = new schema.Entity('boardItem');
export const boardSchema = new schema.Entity('board', {
    docs: [dataDocSchema],
    tables: [tableSchema],
    items: [boardItemSchema],
});

function normalizeBoard(rawBoard: IBoardRaw) {
    const normalizedData = normalize(rawBoard, boardSchema);
    const board: IBoardWithItemIds =
        normalizedData.entities.board[normalizedData.result];
    const {
        dataTable: dataTableById = {},
        dataDoc: dataDocById = {},
        boardItem: boardItemById = {},
    } = normalizedData.entities;
    return {
        board,
        dataTableById,
        dataDocById,
        boardItemById,
    };
}

function receiveBoardWithItems(dispatch: Dispatch, rawBoard: IBoardRaw) {
    const { board, dataTableById, dataDocById, boardItemById } = normalizeBoard(
        rawBoard
    );

    dispatch(receiveDataDocs(dataDocById, [], null, null));
    dispatch(receiveDataTable({}, dataTableById, {}, {}));
    dispatch({
        type: '@@board/RECEIVE_BOARD_WITH_ITEMS',
        payload: {
            board,
            boardItemById,
        },
    });
}

function receiveBoards(boards: IBoard[]): IReceiveBoardsAction {
    const boardById = arrayGroupByField(boards);
    return {
        type: '@@board/RECEIVE_BOARDS',
        payload: {
            boardById,
        },
    };
}

export function fetchBoards(
    filterStr: string = ''
): ThunkResult<Promise<IBoard[]>> {
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
    description: string,
    publicBoard: boolean
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch, getState) => {
        const state = getState();
        const board = (
            await BoardResource.create(
                name,
                state.environment.currentEnvironmentId,
                description,
                publicBoard
            )
        ).data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function updateBoard(
    id: number,
    fields: IBoardUpdatableField
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch) => {
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
            payload: { boardItem, boardId },
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
