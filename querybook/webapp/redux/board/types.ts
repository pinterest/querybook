import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IAccessRequest } from 'const/accessRequest';
import {
    BoardItemType,
    IBoard,
    IBoardEditor,
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
        itemType?: BoardItemType;
        itemId?: number;
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

export interface IUpdateBoardItemDescriptionAction extends Action {
    type: '@@board/UPDATE_BOARD_ITEM_DESCRIPTION';
    payload: {
        boardItem: IBoardItem;
    };
}

export interface IReceiveBoardEditorsAction extends Action {
    type: '@@board/RECEIVE_BOARD_EDITORS';
    payload: {
        boardId: number;
        editors: IBoardEditor[];
    };
}

export interface IReceiveBoardEditorAction extends Action {
    type: '@@board/RECEIVE_BOARD_EDITOR';
    payload: {
        boardId: number;
        editor: IBoardEditor;
    };
}

export interface IRemoveBoardEditorAction extends Action {
    type: '@@board/REMOVE_BOARD_EDITOR';
    payload: {
        boardId: number;
        uid: number;
    };
}

export interface IReceiveBoardAccessRequestsAction extends Action {
    type: '@@board/RECEIVE_BOARD_ACCESS_REQUESTS';
    payload: {
        boardId: number;
        requests: IAccessRequest[];
    };
}

export interface IReceiveBoardAccessRequestAction extends Action {
    type: '@@board/RECEIVE_BOARD_ACCESS_REQUEST';
    payload: {
        boardId: number;
        request: IAccessRequest;
    };
}

export interface IRemoveBoardAccessRequestAction extends Action {
    type: '@@board/REMOVE_BOARD_ACCESS_REQUEST';
    payload: {
        boardId: number;
        uid: number;
    };
}

export interface IUpdateBoardFieldAction extends Action {
    type: '@@board/UPDATE_BOARD_FIELD';
    payload: {
        boardId: number;
        fieldName: string;
        fieldVal: any;
    };
}

export type BoardAction =
    | IReceiveBoardsAction
    | IReceiveBoardWithItemsAction
    | IRemoveBoardAction
    | IReceiveBoardItemAction
    | IRemoveBoardItemAction
    | IMoveBoardItemAction
    | IUpdateBoardItemDescriptionAction
    | IReceiveBoardEditorsAction
    | IReceiveBoardEditorAction
    | IRemoveBoardEditorAction
    | IReceiveBoardAccessRequestsAction
    | IReceiveBoardAccessRequestAction
    | IRemoveBoardAccessRequestAction
    | IUpdateBoardFieldAction;

export interface IBoardState {
    boardById: Record<number, IBoardWithItemIds>;
    boardItemById: Record<number, IBoardItem>;
    editorsByBoardIdUserId: Record<number, Record<number, IBoardEditor>>;
    accessRequestsByBoardIdUserId: Record<
        number,
        Record<number, IAccessRequest>
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
