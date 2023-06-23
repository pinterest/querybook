import { produce } from 'immer';

import { commentStateKeyByEntityType, ICommentRaw } from 'const/comment';
import { convertRawToContentState } from 'lib/richtext/serialize';

import { CommentAction, ICommentState } from './types';

const initialState: ICommentState = {
    cellIdToCommentIds: {},
    tableIdToCommentIds: {},
    commentsById: {},
};

function commentReducer(state = initialState, action: CommentAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@comment/RECEIVE_COMMENTS': {
                const { comments } = action.payload;

                comments.forEach((comment: ICommentRaw) => {
                    draft.commentsById[comment.id] = {
                        ...comment,
                        text: convertRawToContentState(comment.text),
                    };
                });
                return;
            }
            case '@@comment/RECEIVE_NEW_CHILD_COMMENT_ID': {
                const { parentCommentId, childCommentId } = action.payload;
                draft.commentsById[parentCommentId].child_comment_ids.push(
                    childCommentId
                );
                return;
            }
            case '@@comment/ARCHIVE_COMMENT': {
                const { commentId } = action.payload;
                draft.commentsById[commentId].archived = true;
                return;
            }
            case '@@comment/RECEIVE_REACTION_BY_COMMENT_ID': {
                const { commentId, reaction } = action.payload;
                draft.commentsById[commentId].reactions.push(reaction);
                return;
            }
            case '@@comment/REMOVE_REACTION_BY_COMMENT_ID': {
                const { commentId, reactionId } = action.payload;

                draft.commentsById[commentId].reactions = draft.commentsById[
                    commentId
                ].reactions.filter((reaction) => reaction.id !== reactionId);
                return;
            }
            case '@@comment/RECEIVE_COMMENT_IDS_BY_ENTITY_ID': {
                const { entityType, entityId, commentIds } = action.payload;

                const draftIdToCommentIds =
                    draft[commentStateKeyByEntityType[entityType]];

                draftIdToCommentIds[entityId] = [
                    ...(draftIdToCommentIds[entityId] || []),
                    ...commentIds,
                ];
                return;
            }
        }
    });
}

export default commentReducer;
