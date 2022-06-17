import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import {
    BoardItemType,
    IBoard,
    IBoardItem,
    IBoardWithItemIds,
} from 'const/board';

import { IStoreState } from '../store/types';

export interface IReceiveBoardsAction extends Action {
    type: '@@board/RECEIVE_BOARDS';
    payload: {
        boardById: Record<number, IBoard>;
    };
}

export interface IReceiveBoardWithItemsAction extends Action {
    type: '@@board/RECEIVE_BOARD_WITH_ITEMS';
    payload: {
        board: IBoardWithItemIds;
        boardItemById: Record<number, IBoardItem>;
    };
}

export interface IReceiveBoardItemAction extends Action {
    type: '@@board/RECEIVE_BOARD_ITEM';
    payload: {
        boardItem: IBoardItem;
        boardId: number;
    };
}

export interface IRemoveBoardAction extends Action {
    type: '@board/REMOVE_BOARD';
    payload: {
        id: number;
    };
}

export interface IRemoveBoardItemAction extends Action {
    type: '@@board/REMOVE_BOARD_ITEM';
    payload: {
        boardId: number;
        itemId: number;
        itemType: BoardItemType;
    };
}

export interface IMoveBoardItemAction extends Action {
    type: '@@board/MOVE_BOARD_ITEM';
    payload: {
        boardId: number;
        fromIndex: number;
        toIndex: number;
    };
}

export type BoardAction =
    | IReceiveBoardsAction
    | IReceiveBoardWithItemsAction
    | IRemoveBoardAction
    | IReceiveBoardItemAction
    | IRemoveBoardItemAction
    | IMoveBoardItemAction;

export interface IBoardState {
    boardById: Record<number, IBoardWithItemIds>;
    boardItemById: Record<number, IBoardItem>;
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    BoardAction
>;

export type ThunkDispatch = UntypedThunkDispatch<
    IStoreState,
    undefined,
    BoardAction
>;
