import { ContentState } from 'draft-js';

import { IComment, IReaction } from 'const/comment';
import {
    CellCommentResource,
    CommentResource,
    ReactionResource,
    TableCommentResource,
} from 'resource/comment';

import { ThunkResult } from './types';

function fetchCommentsByCell(cellId: number): ThunkResult<Promise<IComment[]>> {
    return async (dispatch) => {
        const { data } = await CellCommentResource.get(cellId);
        dispatch({
            type: '@@comment/RECEIVE_COMMENTS_BY_CELL',
            payload: { cellId, comments: data },
        });
        return data;
    };
}

export function fetchCommentsByCellIfNeeded(
    cellId: number
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const comments = state.comment.cellIdToComment[cellId];
        if (!comments) {
            return dispatch(fetchCommentsByCell(cellId));
        }
    };
}

export function createCellComment(
    cellId: number,
    text: ContentState
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        try {
            const { data } = await CellCommentResource.create(cellId, text);
            dispatch({
                type: '@@comment/RECEIVE_COMMENT_BY_CELL',
                payload: { cellId, comment: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function createCellChildComment(
    cellId: number,
    parentCommentId: number,
    text: ContentState
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        try {
            const { data } = await CommentResource.create(
                parentCommentId,
                text
            );
            dispatch({
                type: '@@comment/RECEIVE_CHILD_COMMENT_BY_CELL',
                payload: { cellId, parentCommentId, comment: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function fetchCommentsByTable(
    tableId: number
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const comments = state.comment.tableIdToComment[tableId];
        if (!comments) {
            return dispatch(fetchCommentsByTable(tableId));
        }
    };
}

export function fetchCommentsByTableIfNeeded(
    tableId: number
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const comments = state.comment.tableIdToComment[tableId];
        if (!comments) {
            return dispatch(fetchCommentsByTable(tableId));
        }
    };
}

export function createTableComment(
    tableId: number,
    text: ContentState
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        try {
            const { data } = await TableCommentResource.create(tableId, text);
            dispatch({
                type: '@@comment/RECEIVE_COMMENT_BY_TABLE',
                payload: { tableId, comment: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function createTableChildComment(
    tableId: number,
    parentCommentId: number,
    text: ContentState
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        try {
            const { data } = await CommentResource.create(
                parentCommentId,
                text
            );
            dispatch({
                type: '@@comment/RECEIVE_CHILD_COMMENT_BY_TABLE',
                payload: { tableId, parentCommentId, comment: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}

export function deleteCommentByCell(
    cellId: number,
    commentId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            await CommentResource.delete(commentId);
            dispatch({
                type: '@@comment/REMOVE_COMMENT_BY_CELL',
                payload: { cellId, commentId },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

export function deleteCommentByTable(
    tableId: number,
    commentId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            await CommentResource.delete(commentId);
            dispatch({
                type: '@@comment/REMOVE_COMMENT_BY_TABLE',
                payload: { tableId, commentId },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

export function updateCommentByCell(
    cellId: number,
    commentId: number,
    text: IComment
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        const { data: newComment } = await CommentResource.update(
            commentId,
            text
        );

        dispatch({
            type: '@@comment/RECEIVE_COMMENT_BY_CELL',
            payload: {
                cellId,
                comment: newComment,
            },
        });

        return newComment;
    };
}

export function updateCommentByTable(
    tableId: number,
    commentId: number,
    text: IComment
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        const { data: newComment } = await CommentResource.update(
            commentId,
            text
        );

        dispatch({
            type: '@@comment/RECEIVE_COMMENT_BY_TABLE',
            payload: {
                tableId,
                comment: newComment,
            },
        });

        return newComment;
    };
}

export function fetchChildCommentByCell(
    cellId: number,
    parentCommentId: number
): ThunkResult<Promise<IComment[]>> {
    return async (dispatch) => {
        const { data } = await CommentResource.get(parentCommentId);
        dispatch({
            type: '@@comment/RECEIVE_CHILD_COMMENTS_BY_CELL',
            payload: { cellId, parentCommentId, comments: data },
        });
        return data;
    };
}

export function fetchChildCommentByTable(
    tableId: number,
    parentCommentId: number
): ThunkResult<Promise<IComment[]>> {
    return async (dispatch) => {
        const { data } = await CommentResource.get(parentCommentId);
        dispatch({
            type: '@@comment/RECEIVE_CHILD_COMMENTS_BY_TABLE',
            payload: { tableId, parentCommentId, comments: data },
        });
        return data;
    };
}

export function updateChildCommentByCell(
    cellId: number,
    parentCommentId: number,
    commentId: number,
    text: IComment
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        const { data: newComment } = await CommentResource.update(
            commentId,
            text
        );

        dispatch({
            type: '@@comment/RECEIVE_CHILD_COMMENT_BY_CELL',
            payload: {
                cellId,
                parentCommentId,
                comment: newComment,
            },
        });

        return newComment;
    };
}

export function updateChildCommentByTable(
    tableId: number,
    parentCommentId: number,
    commentId: number,
    text: IComment
): ThunkResult<Promise<IComment>> {
    return async (dispatch) => {
        const { data: newComment } = await CommentResource.update(
            commentId,
            text
        );

        dispatch({
            type: '@@comment/RECEIVE_CHILD_COMMENT_BY_TABLE',
            payload: {
                tableId,
                parentCommentId,
                comment: newComment,
            },
        });

        return newComment;
    };
}

export function fetchReactionsByCell(
    cellId: number,
    commentId: number
): ThunkResult<Promise<IReaction[]>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.get(commentId);
        dispatch({
            type: '@@comment/RECEIVE_REACTIONS_BY_CELL',
            payload: { cellId, commentId, reactions: data },
        });
        return data;
    };
}

export function fetchReactionsByTable(
    tableId: number,
    commentId: number
): ThunkResult<Promise<IReaction[]>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.get(commentId);
        dispatch({
            type: '@@comment/RECEIVE_REACTIONS_BY_TABLE',
            payload: { tableId, commentId, reactions: data },
        });
        return data;
    };
}

export function addReactionForCellComment(
    cellId: number,
    commentId: number,
    reaction: string
): ThunkResult<Promise<IReaction>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.create(commentId, reaction);

        dispatch({
            type: '@@comment/RECEIVE_REACTION_BY_CELL',
            payload: {
                cellId,
                commentId,
                reaction: data,
            },
        });

        return data;
    };
}

export function addReactionForTableComment(
    tableId: number,
    commentId: number,
    reaction: string
): ThunkResult<Promise<IReaction>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.create(commentId, reaction);

        dispatch({
            type: '@@comment/RECEIVE_REACTION_BY_TABLE',
            payload: {
                tableId,
                commentId,
                reaction: data,
            },
        });

        return data;
    };
}

export function deleteReactionForCellComment(
    cellId: number,
    commentId: number,
    reactionId: number
): ThunkResult<Promise<IReaction>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.delete(reactionId);

        dispatch({
            type: '@@comment/REMOVE_REACTION_BY_CELL',
            payload: {
                cellId,
                commentId,
                reactionId,
            },
        });

        return data;
    };
}

export function deleteReactionForTableComment(
    tableId: number,
    commentId: number,
    reactionId: number
): ThunkResult<Promise<IReaction>> {
    return async (dispatch) => {
        const { data } = await ReactionResource.delete(reactionId);

        dispatch({
            type: '@@comment/REMOVE_REACTION_BY_TABLE',
            payload: {
                tableId,
                commentId,
                reactionId,
            },
        });

        return data;
    };
}
