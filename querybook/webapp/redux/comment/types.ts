import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { IComment, IReaction } from 'const/comment';
import { IStoreState } from 'redux/store/types';

export interface IRecieveCommentsByCell extends Action {
    type: '@@comment/RECEIVE_COMMENTS_BY_CELL';
    payload: {
        cellId: number;
        comments: IComment[];
    };
}

export interface IRecieveCommentsByTable extends Action {
    type: '@@comment/RECEIVE_COMMENTS_BY_TABLE';
    payload: {
        tableId: number;
        comments: IComment[];
    };
}
export interface IRecieveCommentByCell extends Action {
    type: '@@comment/RECEIVE_COMMENT_BY_CELL';
    payload: {
        cellId: number;
        comment: IComment;
    };
}

export interface IRecieveCommentByTable extends Action {
    type: '@@comment/RECEIVE_COMMENT_BY_TABLE';
    payload: {
        tableId: number;
        comment: IComment;
    };
}

export interface IRecieveChildCommentByCell extends Action {
    type: '@@comment/RECEIVE_CHILD_COMMENT_BY_CELL';
    payload: {
        cellId: number;
        parentCommentId: number;
        comment: IComment;
    };
}
export interface IRecieveChildCommentByTable extends Action {
    type: '@@comment/RECEIVE_CHILD_COMMENT_BY_TABLE';
    payload: {
        tableId: number;
        parentCommentId: number;
        comment: IComment;
    };
}
export interface IRecieveChildCommentsByCell extends Action {
    type: '@@comment/RECEIVE_CHILD_COMMENTS_BY_CELL';
    payload: {
        cellId: number;
        parentCommentId: number;
        comments: IComment[];
    };
}
export interface IRecieveChildCommentsByTable extends Action {
    type: '@@comment/RECEIVE_CHILD_COMMENTS_BY_TABLE';
    payload: {
        tableId: number;
        parentCommentId: number;
        comments: IComment[];
    };
}

export interface IRemoveCommentByCell extends Action {
    type: '@@comment/REMOVE_COMMENT_BY_CELL';
    payload: {
        cellId: number;
        commentId: number;
    };
}

export interface IRemoveCommentByTable extends Action {
    type: '@@comment/REMOVE_COMMENT_BY_TABLE';
    payload: {
        tableId: number;
        commentId: number;
    };
}

export interface IRecieveReactionsByCell extends Action {
    type: '@@comment/RECEIVE_REACTIONS_BY_CELL';
    payload: {
        cellId: number;
        commentId: number;
        reactions: IReaction[];
    };
}

export interface IRecieveReactionsByTable extends Action {
    type: '@@comment/RECEIVE_REACTIONS_BY_TABLE';
    payload: {
        tableId: number;
        commentId: number;
        reactions: IReaction[];
    };
}
export interface IRecieveReactionByCell extends Action {
    type: '@@comment/RECEIVE_REACTION_BY_CELL';
    payload: {
        cellId: number;
        commentId: number;
        reaction: IReaction;
    };
}

export interface IRecieveReactionByTable extends Action {
    type: '@@comment/RECEIVE_REACTION_BY_TABLE';
    payload: {
        tableId: number;
        commentId: number;
        reaction: IReaction;
    };
}
export interface IRemoveReactionByCell extends Action {
    type: '@@comment/REMOVE_REACTION_BY_CELL';
    payload: {
        cellId: number;
        commentId: number;
        reactionId: number;
    };
}

export interface IRemoveReactionByTable extends Action {
    type: '@@comment/REMOVE_REACTION_BY_TABLE';
    payload: {
        tableId: number;
        commentId: number;
        reactionId: number;
    };
}

export type CommentAction =
    | IRecieveCommentsByCell
    | IRecieveCommentsByTable
    | IRecieveCommentByCell
    | IRecieveCommentByTable
    | IRecieveChildCommentByCell
    | IRecieveChildCommentByTable
    | IRecieveChildCommentsByCell
    | IRecieveChildCommentsByTable
    | IRemoveCommentByCell
    | IRemoveCommentByTable
    | IRecieveReactionsByCell
    | IRecieveReactionsByTable
    | IRecieveReactionByCell
    | IRecieveReactionByTable
    | IRemoveReactionByCell
    | IRemoveReactionByTable;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    CommentAction
>;

export interface ICommentState {
    cellIdToComment: Record<number, IComment[]>;
    tableIdToComment: Record<number, IComment[]>;
}
