import * as DraftJs from 'draft-js';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { useEvent } from 'hooks/useEvent';
import { fromNow } from 'lib/utils/datetime';
import { matchKeyMap } from 'lib/utils/keyboard';
import { IStoreState } from 'redux/store/types';
import { Comment } from 'ui/Comment/Comment';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { EmptyText, StyledText } from 'ui/StyledText/StyledText';

import './Comments.scss';

const comments = [
    {
        id: 1,
        text: 'this is my comment. this is my comment. this is my comment. this is my comment.',
        uid: 11,
        created_at: 1683662936,
        updated_at: 1683662936,
        reactions: [
            { reaction: '🩵', uid: 10 },
            { reaction: '🩵', uid: 11 },
            { reaction: '🤍', uid: 10 },
        ],
    },
    {
        id: 2,
        text: 'memewowmew',
        uid: 10,
        created_at: 1684662936,
        updated_at: 1683662936,
        reactions: [
            { reaction: '🩵', uid: 10 },
            { reaction: '🩵', uid: 11 },
            { reaction: '🤍', uid: 10 },
        ],
        child_comments: [
            {
                id: 4,
                text: 'this is my comment. this is my comment. this is my comment. this is my comment.',
                uid: 11,
                created_at: 1683662936,
                updated_at: 1683662936,
                reactions: [],
            },
            {
                id: 31,
                text: 'this is my comment. this is my comment. this is my comment. this is my comment.',
                uid: 10,
                created_at: 1683662936,
                updated_at: 1683662936,
                reactions: [
                    { reaction: '🩵', uid: 10 },
                    { reaction: '🩵', uid: 11 },
                    { reaction: '🤍', uid: 10 },
                ],
            },
        ],
    },
];

interface IComment {
    id: number;
    // TODO: clean this
    text: string | DraftJs.ContentState;
    uid: number;
    created_at: number;
    updated_at: number;

    child_comments?: IComment[];

    reactions: IReaction[];
}

export interface IReaction {
    reaction: string;
    uid: number;
}

const initialCommentValue = DraftJs.ContentState.createFromText('');

export const Comments: React.FunctionComponent = () => {
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    const [openThreadIds, setOpenThreadIds] = React.useState<Set<number>>(
        new Set()
    );
    const [currentComment, setCurrentComment] =
        React.useState<DraftJs.ContentState>(initialCommentValue);
    const [editingCommentId, setEditingCommentId] =
        React.useState<number>(null);

    const handleEditComment = (
        commentId: number,
        commentText: DraftJs.ContentState
    ) => {
        setEditingCommentId(commentId);
        setCurrentComment(commentText);
    };

    const handleCommentSave = React.useCallback(() => {
        if (editingCommentId) {
            // TODO: edit comment
            setEditingCommentId(null);
        } else {
            // TODO: save comment
        }
        setCurrentComment(initialCommentValue);
    }, [editingCommentId]);

    const onEnterPress = React.useCallback(
        (evt: KeyboardEvent) => {
            if (
                matchKeyMap(evt, {
                    key: 'Enter',
                    name: 'Comment',
                })
            ) {
                handleCommentSave();
            }
        },
        [handleCommentSave]
    );

    useEvent('keydown', onEnterPress);

    const renderFlatCommentDOM = (comment: IComment) => (
        <Comment
            key={comment.id}
            text={DraftJs.ContentState.createFromText(comment.text as string)}
            // text={comment.text}
            uid={comment.uid}
            createdAt={comment.created_at}
            reactions={comment.reactions}
            editComment={(text) => handleEditComment(comment.id, text)}
        />
    );

    const handleOpenThread = React.useCallback((threadId: number) => {
        setOpenThreadIds((curr) => new Set([...curr, threadId]));
    }, []);

    const renderThreadCommentDOM = (
        parentCommentId: number,
        comments: IComment[]
    ) => {
        if (openThreadIds.has(parentCommentId)) {
            return comments.map(renderFlatCommentDOM);
        }
        const uids = Array.from(
            new Set(comments.map((comment) => comment.uid))
        );
        return (
            <div className="ClosedCommentThread flex-row">
                <div className="flex-row mr8">
                    {uids.map((uid) => (
                        <UserAvatar
                            key={`thread-avatar-${uid}-${parentCommentId}`}
                            uid={uid}
                            tiny
                        />
                    ))}
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
                    <StyledText size="xsmall" color="lightest" cursor="default">
                        Last reply{' '}
                        {fromNow(comments[comments.length - 1].updated_at)}
                    </StyledText>
                </span>
                <span className="HoverText">
                    <StyledText size="xsmall" color="lightest" cursor="default">
                        View Thread
                    </StyledText>
                </span>
            </div>
        );
    };

    const renderCommentDOM = () =>
        comments.map((comment: IComment) => {
            if (comment.child_comments) {
                return (
                    <>
                        {renderFlatCommentDOM(comment)}
                        <div
                            className="CommentThread mt12"
                            onClick={() => handleOpenThread(comment.id)}
                        >
                            {renderThreadCommentDOM(
                                comment.id,
                                comment.child_comments
                            )}
                        </div>
                    </>
                );
            }
            return renderFlatCommentDOM(comment);
        });

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
            <div onClick={() => handleEditComment(null, initialCommentValue)}>
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
            </div>
        </div>
    );
};
