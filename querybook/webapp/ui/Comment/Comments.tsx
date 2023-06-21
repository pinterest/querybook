import * as DraftJs from 'draft-js';
import { Formik } from 'formik';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import {
    CommentEntityType,
    commentStateKeyByEntityType,
    IComment,
} from 'const/comment';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import {
    createChildComment,
    createComment,
    fetchCommentsByEntityIdIfNeeded,
    updateComment,
} from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Comment } from 'ui/Comment/Comment';
import { RichTextField } from 'ui/FormikField/RichTextField';
import { EmptyText, StyledText } from 'ui/StyledText/StyledText';

import { ThreadComment } from './ThreadComment';

import './Comments.scss';

interface IProps {
    entityType: CommentEntityType;
    entityId: number;
}

const emptyCommentValue = DraftJs.ContentState.createFromText('');

export const Comments: React.FunctionComponent<IProps> = ({
    entityType,
    entityId,
}) => {
    const dispatch: Dispatch = useDispatch();

    const { userInfo, commentIds, commentsById } = useShallowSelector(
        (state: IStoreState) => ({
            userInfo: state.user.myUserInfo,
            commentIds:
                state.comment[commentStateKeyByEntityType[entityType]]?.[
                    entityId
                ],
            commentsById: state.comment.commentsById,
        })
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
        (text: DraftJs.ContentState, parentCommentId: number) => {
            if (parentCommentId) {
                dispatch(createChildComment(parentCommentId, text));
            } else {
                dispatch(createComment(entityType, entityId, text));
            }
        },
        [dispatch, entityId, entityType]
    );
    const editComment = React.useCallback(
        (commentId: number, text: DraftJs.ContentState) => {
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

    const handleCommentSave = React.useCallback(
        (values: { text: DraftJs.ContentState }, { resetForm }) => {
            if (editingCommentId) {
                editComment(editingCommentId, values.text);
                setEditingCommentId(null);
            } else {
                handleCreateComment(values.text, editingCommentParentId);
            }
            setCurrentComment(emptyCommentValue);
            resetForm();
        },
        [
            handleCreateComment,
            editComment,
            editingCommentId,
            editingCommentParentId,
        ]
    );
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

    const renderThreadCommentDOM = (comment: IComment) => (
        <React.Fragment key={comment.id + 'thread'}>
            {renderFlatCommentDOM(comment, false)}
            <ThreadComment
                comment={comment}
                renderFlatCommentDOM={renderFlatCommentDOM}
            />
        </React.Fragment>
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
                <Formik
                    enableReinitialize
                    initialValues={{ text: currentComment }}
                    onSubmit={handleCommentSave}
                >
                    {({ submitForm }) => (
                        <>
                            <UserAvatar uid={userInfo?.uid} tiny />
                            <RichTextField name="text" />
                            <IconButton
                                icon="XCircle"
                                onClick={handleCommentClear}
                                noPadding
                                size={18}
                                className="mr12"
                                tooltip="Clear"
                                tooltipPos="left"
                                disabled={
                                    currentComment.getPlainText().length ===
                                        0 && editingCommentId === null
                                }
                            />
                            <IconButton
                                icon="Send"
                                onClick={submitForm}
                                noPadding
                                size={18}
                                className="mr4"
                                tooltip="Comment"
                                tooltipPos="left"
                                // disabled={
                                //     currentComment.getPlainText().length === 0
                                // }
                            />
                        </>
                    )}
                </Formik>
            </div>
        </div>
    ) : null;
};
