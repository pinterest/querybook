import * as DraftJs from 'draft-js';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import {
    CommentEntityType,
    commentStateKeyByEntityType,
    IComment,
} from 'const/comment';
import {
    createChildComment,
    createComment,
    fetchChildCommentsByParentCommentIdIfNeeded,
    fetchCommentsByEntityIdIfNeeded,
    updateComment,
} from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Comment } from 'ui/Comment/Comment';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { EmptyText, StyledText } from 'ui/StyledText/StyledText';

import './Comments.scss';

interface IProps {
    entityType: CommentEntityType;
    entityId: number;
}

const emptyCommentValue = DraftJs.ContentState.createFromText(' ');

export const Comments: React.FunctionComponent<IProps> = ({
    entityType,
    entityId,
}) => {
    const dispatch: Dispatch = useDispatch();

    const { userInfo, commentIds, commentsById } = useSelector(
        (state: IStoreState) => ({
            userInfo: state.user.myUserInfo,
            commentIds:
                state.comment[commentStateKeyByEntityType[entityType]]?.[
                    entityId
                ],
            commentsById: state.comment.commentsById,
        })
    );

    const [openThreadIds, setOpenThreadIds] = React.useState<Set<number>>(
        new Set()
    );
    const [currentComment, setCurrentComment] =
        React.useState<DraftJs.ContentState>(emptyCommentValue);
    const [editingCommentParentId, setEditingCommentParentId] =
        React.useState<number>(null);
    const [editingCommentId, setEditingCommentId] =
        React.useState<number>(null);

    const loadComments = React.useCallback(
        () => dispatch(fetchCommentsByEntityIdIfNeeded(entityType, entityId)),

        [dispatch, entityId, entityType]
    );

    const handleCreateComment = React.useCallback(
        (text, parentCommentId) => {
            if (parentCommentId) {
                dispatch(createChildComment(parentCommentId, text));
            } else {
                dispatch(createComment(entityType, entityId, text));
            }
        },
        [dispatch, entityId, entityType]
    );
    const editComment = React.useCallback(
        (commentId, text) => {
            dispatch(updateComment(commentId, text));
        },
        [dispatch]
    );

    React.useEffect(() => {
        loadComments();
    }, [loadComments]);

    const handleEditComment = React.useCallback(
        (
            commentId: number,
            commentText: DraftJs.ContentState,
            parentCommentId?: number
        ) => {
            setEditingCommentId(commentId);
            setEditingCommentParentId(parentCommentId || null);
            setCurrentComment(commentText);
        },
        []
    );

    const handleCommentSave = React.useCallback(() => {
        if (editingCommentId) {
            editComment(editingCommentId, currentComment);
            setEditingCommentId(null);
        } else {
            handleCreateComment(currentComment, editingCommentParentId);
        }
        setCurrentComment(emptyCommentValue);
    }, [
        handleCreateComment,
        currentComment,
        editComment,
        editingCommentId,
        editingCommentParentId,
    ]);
    const handleCommentClear = React.useCallback(() => {
        setEditingCommentId(null);
        setEditingCommentParentId(null);
        setCurrentComment(emptyCommentValue);
    }, []);

    const renderFlatCommentDOM = (comment: IComment, isChild: boolean) =>
        comment ? (
            <Comment
                key={comment.id}
                comment={comment}
                editComment={(text) => handleEditComment(comment.id, text)}
                isBeingEdited={editingCommentId === comment.id}
                isChild={isChild}
                createChildComment={() => setEditingCommentParentId(comment.id)}
                isBeingRepliedTo={editingCommentParentId === comment.id}
            />
        ) : null;

    const handleOpenThread = React.useCallback(
        (parentCommentId: number, childCommentIds: number[] = []) => {
            dispatch(
                fetchChildCommentsByParentCommentIdIfNeeded(
                    parentCommentId,
                    childCommentIds
                )
            );
            setOpenThreadIds((curr) => new Set([...curr, parentCommentId]));
        },
        [dispatch]
    );

    const loadingCommentDOM = React.useMemo(
        () => (
            <div className="Comment mv8">
                <StyledText
                    size="xsmall"
                    color="lightest"
                    cursor="default"
                    isItalic
                >
                    Loading Comment
                </StyledText>
            </div>
        ),
        []
    );

    const renderThreadCommentDOM = (comment: IComment) => (
        <>
            {renderFlatCommentDOM(comment, false)}
            <div
                className="CommentThread mt16 mb12"
                onClick={() =>
                    handleOpenThread(comment.id, comment.child_comment_ids)
                }
            >
                {openThreadIds.has(comment.id) ? (
                    comment.child_comment_ids?.map((commentId) =>
                        commentsById[commentId]
                            ? renderFlatCommentDOM(
                                  commentsById[commentId],
                                  true
                              )
                            : loadingCommentDOM
                    )
                ) : (
                    <div className="ClosedCommentThread flex-row">
                        <StyledText
                            className="ThreadCount mr8"
                            size="xsmall"
                            color="accent"
                            cursor="default"
                        >
                            {comment.child_comment_ids.length}{' '}
                            {comment.child_comment_ids.length === 1
                                ? 'Reply'
                                : 'Replies'}
                        </StyledText>
                        <span className="HoverText">
                            <StyledText
                                size="xsmall"
                                color="lightest"
                                cursor="pointer"
                            >
                                View Thread
                            </StyledText>
                        </span>
                    </div>
                )}
            </div>
        </>
    );

    const renderCommentDOM = () =>
        commentIds.map((commentId: number) =>
            commentsById[commentId]?.child_comment_ids?.length
                ? renderThreadCommentDOM(commentsById[commentId])
                : renderFlatCommentDOM(commentsById[commentId], false)
        );

    const renderEditingCommentWarning = () => (
        <div className="Comments-edit-warning flex-row ml48 mb4">
            <StyledText
                size="xsmall"
                color="lightest"
                cursor="default"
                className="mr16"
            >
                Editing Comment
            </StyledText>
        </div>
    );

    return commentIds ? (
        <div className="Comments">
            <div className="Comments-list p16">
                {commentIds.length ? (
                    renderCommentDOM()
                ) : (
                    <EmptyText>No Comments</EmptyText>
                )}
            </div>
            {editingCommentId ? renderEditingCommentWarning() : null}
            <div className="Comment-form flex-row pv12 ph16">
                <UserAvatar uid={userInfo?.uid} tiny />
                <RichTextEditor
                    value={currentComment}
                    onChange={(editorState) =>
                        setCurrentComment(editorState.getCurrentContent())
                    }
                    placeholder={commentIds.length ? 'Reply' : 'Comment'}
                />
                <IconButton
                    icon="XCircle"
                    onClick={handleCommentClear}
                    noPadding
                    size={18}
                    className="mr12"
                    tooltip="Clear"
                    tooltipPos="left"
                    disabled={
                        currentComment.getPlainText().length === 0 &&
                        editingCommentId === null
                    }
                />
                <IconButton
                    icon="Send"
                    onClick={handleCommentSave}
                    noPadding
                    size={18}
                    className="mr4"
                    tooltip="Comment"
                    tooltipPos="left"
                    disabled={currentComment.getPlainText().length === 0}
                />
            </div>
        </div>
    ) : null;
};
