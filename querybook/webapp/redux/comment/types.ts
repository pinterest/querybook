import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import {
    CommentEntityType,
    IComment,
    ICommentRaw,
    IReaction,
} from 'const/comment';
import { IStoreState } from 'redux/store/types';

export interface IRecieveCommentIdsByEntityId extends Action {
    type: '@@comment/RECEIVE_COMMENT_IDS_BY_ENTITY_ID';
    payload: {
        entityType: CommentEntityType;
        entityId: number;
        commentIds: number[];
    };
}

export interface IRecieveComments extends Action {
    type: '@@comment/RECEIVE_COMMENTS';
    payload: {
        comments: ICommentRaw[];
    };
}
export interface IRecieveNewChildCommentId extends Action {
    type: '@@comment/RECEIVE_NEW_CHILD_COMMENT_ID';
    payload: {
        parentCommentId: number;
        childCommentId: number;
    };
}
export interface IRecieveReactionByCommentId extends Action {
    type: '@@comment/RECEIVE_REACTION_BY_COMMENT_ID';
    payload: {
        commentId: number;
        reaction: IReaction;
    };
}
export interface IRemoveReactionByCommentId extends Action {
    type: '@@comment/REMOVE_REACTION_BY_COMMENT_ID';
    payload: {
        commentId: number;
        reactionId: number;
    };
}

export interface IRemoveCommentByEntityId extends Action {
    type: '@@comment/REMOVE_COMMENT_BY_ENTITY_ID';
    payload: {
        entityType: CommentEntityType;
        entityId: number;
        commentId: number;
    };
}

export type CommentAction =
    | IRecieveComments
    | IRecieveComments
    | IRecieveNewChildCommentId
    | IRecieveReactionByCommentId
    | IRemoveReactionByCommentId
    | IRecieveCommentIdsByEntityId
    | IRemoveCommentByEntityId;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    CommentAction
>;

export interface ICommentState {
    cellIdToCommentIds: Record<number, number[]>;
    tableIdToCommentIds: Record<number, number[]>;
    commentsById: Record<number, IComment>;
}
