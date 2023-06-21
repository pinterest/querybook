import { ContentState } from 'draft-js';

import {
    CommentEntityType,
    commentStateKeyByEntityType,
    ICommentRaw,
    IReaction,
} from 'const/comment';
import { commentResourceByEntityType } from 'hooks/useResource';
import { CommentResource, ReactionResource } from 'resource/comment';

import { ThunkResult } from './types';

function fetchCommentsByEntityId(
    entityType: CommentEntityType,
    entityId: number
): ThunkResult<Promise<ICommentRaw[]>> {
    return async (dispatch) => {
        const { data: comments } = await commentResourceByEntityType[
            entityType
        ].get(entityId);
        dispatch({
            type: '@@comment/RECEIVE_COMMENT_IDS_BY_ENTITY_ID',
            payload: {
                entityType,
                entityId,
                commentIds: comments.map((comment: ICommentRaw) => comment.id),
            },
        });
        dispatch({
            type: '@@comment/RECEIVE_COMMENTS',
            payload: {
                comments,
            },
        });
        return comments;
    };
}

export function fetchCommentsByEntityIdIfNeeded(
    entityType: CommentEntityType,
    entityId: number
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const comments =
            state.comment[commentStateKeyByEntityType[entityType]]?.[entityId];
        if (!comments) {
            return dispatch(fetchCommentsByEntityId(entityType, entityId));
        }
    };
}

function fetchChildCommentsByParentCommentId(
    parentCommentId: number
): ThunkResult<Promise<ICommentRaw[]>> {
    return async (dispatch) => {
        const { data: comments } = await CommentResource.get(parentCommentId);
        dispatch({
            type: '@@comment/RECEIVE_COMMENTS',
            payload: {
                comments,
            },
        });
        return comments;
    };
}

export function fetchChildCommentsByParentCommentIdIfNeeded(
    parentCommentId: number,
    childCommentIds: number[]
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const isMissingChildComments = childCommentIds.some(
            (id) => !state.comment.commentsById[id]
        );
        if (isMissingChildComments) {
            return dispatch(
                fetchChildCommentsByParentCommentId(parentCommentId)
            );
        }
        return Promise.resolve(null);
    };
}

export function createComment(
    entityType: CommentEntityType,
    entityId: number,
    text: ContentState
): ThunkResult<Promise<ICommentRaw>> {
    return async (dispatch) => {
        try {
            const { data: comment } = await commentResourceByEntityType[
                entityType
            ].create(entityId, text);
            dispatch({
                type: '@@comment/RECEIVE_COMMENT_IDS_BY_ENTITY_ID',
                payload: { entityType, entityId, commentIds: [comment.id] },
            });
            dispatch({
                type: '@@comment/RECEIVE_COMMENTS',
                payload: {
                    comments: [comment],
                },
            });
            return comment;
        } catch (e) {
            console.error(e);
        }
    };
}

export function createChildComment(
    parentCommentId: number,
    text: ContentState
): ThunkResult<Promise<ICommentRaw>> {
    return async (dispatch) => {
        try {
            const { data: childComment } = await CommentResource.create(
                parentCommentId,
                text
            );
            dispatch({
                type: '@@comment/RECEIVE_NEW_CHILD_COMMENT_ID',
                payload: { parentCommentId, childCommentId: childComment.id },
            });
            dispatch({
                type: '@@comment/RECEIVE_COMMENTS',
                payload: {
                    comments: [childComment],
                },
            });
            return childComment;
        } catch (e) {
            console.error(e);
        }
    };
}

// TODO: update this to show archived comments in UI
export function deleteComment(commentId: number): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            const { data: newComment } = await CommentResource.update(
                commentId
            );
            dispatch({
                type: '@@comment/RECEIVE_COMMENTS',
                payload: {
                    comments: [newComment],
                },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

export function updateComment(
    commentId: number,
    text: ContentState
): ThunkResult<Promise<ICommentRaw>> {
    return async (dispatch) => {
        const { data: newComment } = await CommentResource.update(
            commentId,
            text
        );

        dispatch({
            type: '@@comment/RECEIVE_COMMENTS',
            payload: {
                comments: [newComment],
            },
        });

        return newComment;
    };
}

export function addReactionByCommentId(
    commentId: number,
    reaction: string,
    uid: number
): ThunkResult<Promise<IReaction>> {
    return async (dispatch, getState) => {
        // checking for dup here bc backend can't tell the difference between emojis
        const state = getState();
        const comment = state.comment.commentsById[commentId];
        const isDuplicate = comment.reactions.find(
            (re) => re.reaction === reaction && re.created_by === uid
        );
        if (isDuplicate) {
            return;
        }
        const { data } = await ReactionResource.create(commentId, reaction);

        dispatch({
            type: '@@comment/RECEIVE_REACTION_BY_COMMENT_ID',
            payload: {
                commentId,
                reaction: data,
            },
        });

        return data;
    };
}

export function deleteReactionByCommentId(
    commentId: number,
    reactionId: number
): ThunkResult<Promise<IReaction>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.delete(reactionId);

        dispatch({
            type: '@@comment/REMOVE_REACTION_BY_COMMENT_ID',
            payload: {
                commentId,
                reactionId,
            },
        });

        return data;
    };
}
