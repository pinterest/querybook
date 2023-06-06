import * as DraftJs from 'draft-js';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { IComment } from 'const/comment';
import { fromNow } from 'lib/utils/datetime';
import {
    createCellChildComment,
    createCellComment,
    createTableChildComment,
    createTableComment,
    fetchCommentsByCellIfNeeded,
    fetchCommentsByTableIfNeeded,
    updateChildCommentByCell,
    updateChildCommentByTable,
    updateCommentByCell,
    updateCommentByTable,
} from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Comment } from 'ui/Comment/Comment';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { EmptyText, StyledText } from 'ui/StyledText/StyledText';

import './Comments.scss';

interface IProps {
    cellId?: number;
    tableId?: number;
}

const emptyCommentValue = DraftJs.ContentState.createFromText('');
const MAX_THREAD_AVATAR_COUNT = 5;

export const Comments: React.FunctionComponent<IProps> = ({
    cellId,
    tableId,
}) => {
    const dispatch: Dispatch = useDispatch();

    const { userInfo, comments } = useSelector((state: IStoreState) => ({
        userInfo: state.user.myUserInfo,
        comments: cellId
            ? state.comment.cellIdToComment[cellId]
            : state.comment.tableIdToComment[tableId],
    }));

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
        () =>
            cellId
                ? dispatch(fetchCommentsByCellIfNeeded(cellId))
                : dispatch(fetchCommentsByTableIfNeeded(tableId)),

        [cellId, dispatch, tableId]
    );

    const createComment = React.useCallback(
        (text, parentCommentId) => {
            if (parentCommentId) {
                const createAction = cellId
                    ? createCellChildComment
                    : createTableChildComment;
                dispatch(
                    createAction(cellId || tableId, parentCommentId, text)
                );
            } else {
                const createAction = cellId
                    ? createCellComment
                    : createTableComment;
                dispatch(createAction(cellId || tableId, text));
            }
        },
        [cellId, dispatch, tableId]
    );
    const editComment = React.useCallback(
        (commentId, text, parentCommentId) => {
            if (parentCommentId) {
                const updateAction = cellId
                    ? updateChildCommentByCell
                    : updateChildCommentByTable;
                dispatch(
                    updateAction(
                        cellId || tableId,
                        parentCommentId,
                        commentId,
                        text
                    )
                );
            } else {
                const updateAction = cellId
                    ? updateCommentByCell
                    : updateCommentByTable;
                dispatch(updateAction(cellId || tableId, commentId, text));
            }
        },
        [cellId, dispatch, tableId]
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
            editComment(
                editingCommentId,
                currentComment,
                editingCommentParentId
            );
            setEditingCommentId(null);
        } else {
            createComment(currentComment, editingCommentParentId);
        }
        setCurrentComment(emptyCommentValue);
    }, [
        createComment,
        currentComment,
        editComment,
        editingCommentId,
        editingCommentParentId,
    ]);

    const renderFlatCommentDOM = (comment: IComment, isChild: boolean) => (
        <Comment
            key={comment.id}
            comment={comment}
            editComment={(text) => handleEditComment(comment.id, text)}
            isBeingEdited={editingCommentId === comment.id}
            isChild={isChild}
            createChildComment={() => setEditingCommentParentId(comment.id)}
            isBeingRepliedTo={editingCommentParentId === comment.id}
        />
    );

    const handleOpenThread = React.useCallback((threadId: number) => {
        setOpenThreadIds((curr) => new Set([...curr, threadId]));
    }, []);

    const renderThreadCommentDOM = (comment: IComment) => {
        if (openThreadIds.has(comment.id)) {
            return comment.child_comments.map((comment) =>
                renderFlatCommentDOM(comment, true)
            );
        }
        const uids = Array.from(
            new Set(comment.child_comments.map((comment) => comment.uid))
        );
        return (
            <>
                {renderFlatCommentDOM(comment, false)}
                <div
                    className="CommentThread mt12"
                    onClick={() => handleOpenThread(comment.id)}
                >
                    <div className="ClosedCommentThread flex-row">
                        <div className="flex-row mr8">
                            {uids
                                .slice(0, MAX_THREAD_AVATAR_COUNT)
                                .map((uid) => (
                                    <UserAvatar
                                        key={`thread-avatar-${uid}-${comment.id}`}
                                        uid={uid}
                                        tiny
                                    />
                                ))}
                            {uids.length - 1 >= MAX_THREAD_AVATAR_COUNT ? (
                                <div className="NumberAvatar">
                                    {uids.length - MAX_THREAD_AVATAR_COUNT}
                                </div>
                            ) : null}
                        </div>
                        <StyledText
                            className="ThreadCount mr8"
                            size="xsmall"
                            color="accent"
                            cursor="default"
                        >
                            {comments.length}{' '}
                            {comments.length === 1 ? 'Reply' : 'Replies'}
                        </StyledText>
                        <span className="LastReplyDate">
                            <StyledText
                                size="xsmall"
                                color="lightest"
                                cursor="default"
                            >
                                Last reply{' '}
                                {fromNow(
                                    comments[comments.length - 1].updated_at
                                )}
                            </StyledText>
                        </span>
                        <span className="HoverText">
                            <StyledText
                                size="xsmall"
                                color="lightest"
                                cursor="default"
                            >
                                View Thread
                            </StyledText>
                        </span>
                    </div>
                </div>
            </>
        );
    };

    const renderCommentDOM = () =>
        comments.map((comment: IComment) =>
            comment.child_comments
                ? renderThreadCommentDOM(comment)
                : renderFlatCommentDOM(comment, false)
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
            <div onClick={() => handleEditComment(null, emptyCommentValue)}>
                <StyledText
                    size="xsmall"
                    color="lightest"
                    cursor="pointer"
                    weight="bold"
                >
                    Clear
                </StyledText>
            </div>
        </div>
    );

    return (
        <div className="Comments">
            <div className="Comments-list p16">
                {comments.length ? (
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
                    placeholder={comments.length ? 'Reply' : 'Comment'}
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
    );
};
