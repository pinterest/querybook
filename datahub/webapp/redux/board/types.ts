import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IBoard, IBoardWithItemIds, BoardItemType } from 'const/board';
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
    };
}

export interface IReceiveBoardItemAction extends Action {
    type: '@@board/RECEIVE_BOARD_ITEM';
    payload: {
        boardId: number;
        itemId: number;
        itemType: BoardItemType;
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

export type BoardAction =
    | IReceiveBoardsAction
    | IReceiveBoardWithItemsAction
    | IRemoveBoardAction
    | IReceiveBoardItemAction
    | IRemoveBoardItemAction;

export interface IBoardState {
    boardById: Record<number, IBoard>;
    boardIdToItemsId: Record<
        number,
        {
            docs: number[];
            tables: number[];
        }
    >;
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
