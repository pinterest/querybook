import { normalize, schema } from 'normalizr';
import { ThunkResult, IReceiveBoardsAction } from './types';
import ds from 'lib/datasource';
import { arrayGroupByField } from 'lib/utils';
import {
    IBoardWithItemIds,
    IBoard,
    IBoardRaw,
    BoardItemType,
} from 'const/board';
import { Dispatch } from 'redux/store/types';
import { receiveDataDocs } from 'redux/dataDoc/action';
import { receiveDataTable } from 'redux/dataSources/action';

export const dataDocSchema = new schema.Entity('dataDoc');
export const tableSchema = new schema.Entity('dataTable');
export const boardSchema = new schema.Entity('board', {
    docs: [dataDocSchema],
    tables: [tableSchema],
});

function normalizeBoard(rawBoard: IBoardRaw) {
    const normalizedData = normalize(rawBoard, boardSchema);
    const board: IBoardWithItemIds =
        normalizedData.entities.board[normalizedData.result];
    const {
        dataTable: dataTableById = {},
        dataDoc: dataDocById = {},
    } = normalizedData.entities;
    return {
        board,
        dataTableById,
        dataDocById,
    };
}

function receiveBoardWithItems(dispatch: Dispatch, rawBoard: IBoardRaw) {
    const { board, dataTableById, dataDocById } = normalizeBoard(rawBoard);

    dispatch(receiveDataDocs(dataDocById, null, null));
    dispatch(receiveDataTable({}, dataTableById, {}));
    dispatch({
        type: '@@board/RECEIVE_BOARD_WITH_ITEMS',
        payload: {
            board,
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
        const rawBoards: IBoard[] = (
            await ds.fetch('/board/', {
                environment_id: state.environment.currentEnvironmentId,
                filter_str: filterStr,
            })
        ).data;
        dispatch(receiveBoards(rawBoards));
        return rawBoards;
    };
}

export function fetchBoard(id: number): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch) => {
        const board: IBoardRaw = (await ds.fetch(`/board/${id}/`)).data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function fetchBoardIfNeeded(id: number): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const state = getState();
        if (
            state.board.boardIdToItemsId[id] == null ||
            state.board.boardById[id] == null
        ) {
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
        const board: IBoardRaw = (
            await ds.save('/board/', {
                name,
                environment_id: state.environment.currentEnvironmentId,
                owner_uid: state.user.myUserInfo.uid,
                description,
                public: publicBoard,
            })
        ).data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function updateBoard(
    id: number,
    fields: {
        public?: boolean;
        description?: string;
        name?: string;
    }
): ThunkResult<Promise<IBoardRaw>> {
    return async (dispatch) => {
        const board: IBoardRaw = (await ds.update(`/board/${id}/`, fields))
            .data;
        receiveBoardWithItems(dispatch, board);
        return board;
    };
}

export function deleteBoard(id: number): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await ds.delete(`/board/${id}/`);
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
        await ds.save(`/board/${boardId}/${itemType}/${itemId}/`);
        dispatch({
            type: '@@board/RECEIVE_BOARD_ITEM',
            payload: {
                boardId,
                itemId,
                itemType,
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
        await ds.delete(`/board/${boardId}/${itemType}/${itemId}/`);
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
