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
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';
import {
    createChildComment,
    createComment,
    deleteComment,
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

const ON_SUBMIT_SHORTCUT = getShortcutSymbols(
    KeyMap.overallUI.SubmitComment.key
);

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
    const [openThreadIds, setOpenThreadIds] = React.useState<Set<number>>(
        new Set()
    );

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
            commentId: number = null,
            commentText: DraftJs.ContentState = emptyCommentValue,
            parentCommentId: number = null
        ) => {
            setEditingCommentId(commentId);
            setCurrentComment(commentText);
            setEditingCommentParentId(parentCommentId);
            if (parentCommentId && !openThreadIds.has(parentCommentId)) {
                setOpenThreadIds((ids) => new Set(ids).add(parentCommentId));
            }
        },
        [openThreadIds]
    );

    const handleCommentSave = React.useCallback(
        async (values: { text: DraftJs.ContentState }, { resetForm }) => {
            if (editingCommentId) {
                await editComment(editingCommentId, values.text);
            } else {
                await handleCreateComment(values.text, editingCommentParentId);
            }
            handleEditComment();
            resetForm();
        },
        [
            editingCommentId,
            handleEditComment,
            editComment,
            handleCreateComment,
            editingCommentParentId,
        ]
    );

    const handleCommentClear = React.useCallback(() => {
        setEditingCommentId(null);
        setEditingCommentParentId(null);
        setCurrentComment(emptyCommentValue);
    }, []);

    const handleArchiveComment = React.useCallback(
        (commentId: number) => dispatch(deleteComment(commentId)),
        [dispatch]
    );

    const renderFlatCommentDOM = (
        comment: IComment,
        parentCommentId?: number
    ) =>
        comment ? (
            <Comment
                key={comment.id}
                comment={comment}
                editComment={(text) =>
                    handleEditComment(comment.id, text, parentCommentId)
                }
                deleteComment={() => handleArchiveComment(comment.id)}
                isBeingEdited={editingCommentId === comment.id}
                isChild={Boolean(parentCommentId)}
                onCreateChildComment={() =>
                    handleEditComment(undefined, undefined, comment.id)
                }
                isBeingRepliedTo={
                    editingCommentParentId === comment.id &&
                    editingCommentId !== comment.id
                }
                onReplyingToClick={handleCommentClear}
            />
        ) : null;

    const renderThreadCommentDOM = (comment: IComment) => (
        <React.Fragment key={comment.id + 'thread'}>
            {renderFlatCommentDOM(comment)}
            <ThreadComment
                key={comment.id + 'thread comments'}
                comment={comment}
                renderFlatCommentDOM={renderFlatCommentDOM}
                isOpen={openThreadIds.has(comment.id)}
                openThread={() =>
                    setOpenThreadIds((ids) => new Set(ids).add(comment.id))
                }
            />
        </React.Fragment>
    );

    const renderCommentDOM = () =>
        commentIds.map((commentId: number) =>
            commentsById[commentId]?.child_comment_ids?.length
                ? renderThreadCommentDOM(commentsById[commentId])
                : renderFlatCommentDOM(commentsById[commentId])
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

    return (
        <div className="Comments">
            <div className="Comments-list p16">
                {commentIds?.length ? (
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
                    {({ submitForm, values, setValues }) => {
                        const isTextEmpty =
                            values.text.getPlainText().length === 0 &&
                            editingCommentId === null;
                        return (
                            <>
                                <UserAvatar uid={userInfo?.uid} tiny />
                                <RichTextField
                                    name="text"
                                    autoFocus
                                    onSubmit={submitForm}
                                />
                                <IconButton
                                    icon="XCircle"
                                    onClick={() => {
                                        handleCommentClear();
                                        setValues({
                                            text: emptyCommentValue,
                                        });
                                    }}
                                    noPadding
                                    size={18}
                                    className="mr12"
                                    tooltip="Clear"
                                    tooltipPos="left"
                                    disabled={isTextEmpty}
                                />
                                <IconButton
                                    icon="Send"
                                    onClick={submitForm}
                                    noPadding
                                    size={18}
                                    className="mr4"
                                    tooltip={`Comment (${ON_SUBMIT_SHORTCUT})`}
                                    tooltipPos="left"
                                    disabled={isTextEmpty}
                                />
                            </>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
};
