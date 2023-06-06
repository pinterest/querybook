import { produce } from 'immer';

import { CommentAction, ICommentState } from './types';

const initialState: ICommentState = {
    cellIdToComment: {},
    tableIdToComment: {},
};

function commentReducer(state = initialState, action: CommentAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@comment/RECEIVE_COMMENTS_BY_CELL': {
                const { cellId, comments } = action.payload;

                draft.cellIdToComment[cellId] = comments;
                return;
            }
            case '@@comment/RECEIVE_COMMENTS_BY_TABLE': {
                const { tableId, comments } = action.payload;

                draft.tableIdToComment[tableId] = comments;

                return;
            }
            case '@@comment/RECEIVE_COMMENT_BY_CELL': {
                const { cellId, comment: newComment } = action.payload;
                draft.cellIdToComment[cellId] = draft.cellIdToComment[
                    cellId
                ].filter((comment) =>
                    comment.id === newComment.id ? newComment : comment
                );

                return;
            }

            case '@@comment/RECEIVE_COMMENT_BY_TABLE': {
                const { tableId, comment: newComment } = action.payload;
                draft.tableIdToComment[tableId] = draft.tableIdToComment[
                    tableId
                ].map((comment) =>
                    comment.id === newComment.id ? newComment : comment
                );

                return;
            }
            case '@@comment/RECEIVE_CHILD_COMMENT_BY_CELL': {
                const {
                    cellId,
                    parentCommentId,
                    comment: childComment,
                } = action.payload;
                draft.cellIdToComment[cellId] = draft.cellIdToComment[
                    cellId
                ].map((comment) => {
                    if (comment.id !== parentCommentId) {
                        return comment;
                    }
                    const updatedChildren = (comment.child_comments || []).map(
                        (existingChildren) =>
                            existingChildren.id === childComment.id
                                ? childComment
                                : existingChildren
                    );
                    return { ...comment, child_comments: updatedChildren };
                });

                return;
            }
            case '@@comment/RECEIVE_CHILD_COMMENT_BY_TABLE': {
                const {
                    tableId,
                    parentCommentId,
                    comment: childComment,
                } = action.payload;
                draft.tableIdToComment[tableId] = draft.tableIdToComment[
                    tableId
                ].map((comment) => {
                    if (comment.id !== parentCommentId) {
                        return comment;
                    }
                    const updatedChildren = (comment.child_comments || []).map(
                        (existingChildren) =>
                            existingChildren.id === childComment.id
                                ? childComment
                                : existingChildren
                    );
                    return { ...comment, child_comments: updatedChildren };
                });

                return;
            }
            case '@@comment/REMOVE_COMMENT_BY_CELL': {
                const { cellId, commentId } = action.payload;

                draft.cellIdToComment[cellId] = draft.cellIdToComment[
                    cellId
                ].filter((comment) => comment.id !== commentId);

                return;
            }
            case '@@comment/REMOVE_COMMENT_BY_TABLE': {
                const { tableId, commentId } = action.payload;

                draft.tableIdToComment[tableId] = draft.tableIdToComment[
                    tableId
                ].filter((comment) => comment.id !== commentId);

                return;
            }
            case '@@comment/RECEIVE_REACTION_BY_CELL': {
                const { cellId, commentId, reaction } = action.payload;

                draft.cellIdToComment[cellId] = draft.cellIdToComment[
                    cellId
                ].map((comment) => {
                    if (comment.id !== commentId) {
                        return comment;
                    }
                    const updatedReactions = (comment.reactions || []).map(
                        (existingReaction) =>
                            existingReaction.id === reaction.id
                                ? reaction
                                : existingReaction
                    );
                    return { ...comment, reactions: updatedReactions };
                });

                return;
            }
            case '@@comment/RECEIVE_REACTION_BY_TABLE': {
                const { tableId, commentId, reaction } = action.payload;

                draft.tableIdToComment[tableId] = draft.tableIdToComment[
                    tableId
                ].map((comment) => {
                    if (comment.id !== commentId) {
                        return comment;
                    }
                    const updatedReactions = (comment.reactions || []).map(
                        (existingReaction) =>
                            existingReaction.id === reaction.id
                                ? reaction
                                : existingReaction
                    );
                    return { ...comment, reactions: updatedReactions };
                });

                return;
            }
            case '@@comment/REMOVE_REACTION_BY_CELL': {
                const { cellId, commentId, reactionId } = action.payload;

                draft.cellIdToComment[cellId] = draft.cellIdToComment[
                    cellId
                ].map((comment) => {
                    if (comment.id !== commentId) {
                        return comment;
                    }
                    const updatedReactions = comment.reactions.filter(
                        (existingReaction) => existingReaction.id !== reactionId
                    );
                    return { ...comment, reactions: updatedReactions };
                });

                return;
            }
            case '@@comment/REMOVE_REACTION_BY_TABLE': {
                const { tableId, commentId, reactionId } = action.payload;

                draft.tableIdToComment[tableId] = draft.tableIdToComment[
                    tableId
                ].map((comment) => {
                    if (comment.id !== commentId) {
                        return comment;
                    }
                    const updatedReactions = comment.reactions.filter(
                        (existingReaction) => existingReaction.id !== reactionId
                    );
                    return { ...comment, reactions: updatedReactions };
                });

                return;
            }
        }
    });
}

export default commentReducer;
