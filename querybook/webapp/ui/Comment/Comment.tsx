import clsx from 'clsx';
import * as DraftJS from 'draft-js';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { UserName } from 'components/UserBadge/UserName';
import { IComment, IReaction } from 'const/comment';
import { fromNow } from 'lib/utils/datetime';
import { undoDeleteComment } from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';
import { Reactions } from './Reactions';

interface IProps {
    comment: IComment;
    editComment: (text: DraftJS.ContentState) => void;
    deleteComment: () => Promise<void>;
    isBeingEdited: boolean;
    isBeingRepliedTo: boolean;
    isChild: boolean;
    onCreateChildComment: () => void;
    onReplyingToClick: () => void;
}

const formatReactionsByEmoji = (
    reactions: IReaction[]
): Record<number, IReaction[]> => {
    const formattedReactions = {};
    reactions.forEach((reaction) => {
        formattedReactions[reaction.reaction] =
            formattedReactions[reaction.reaction] ?? [];
        formattedReactions[reaction.reaction].push(reaction);
    });
    return formattedReactions;
};

export const Comment: React.FunctionComponent<IProps> = ({
    comment,
    editComment,
    deleteComment,
    isBeingEdited,
    isBeingRepliedTo,
    isChild,
    onCreateChildComment,
    onReplyingToClick,
}) => {
    const dispatch: Dispatch = useDispatch();

    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
    const [recentlyArchived, setRecentlyArchived] =
        React.useState<boolean>(false);

    const {
        id,
        text,
        created_by: uid,
        created_at: createdAt,
        updated_at: updatedAt,
        reactions,
        archived,
    } = comment;

    const isAuthor = React.useMemo(
        () => uid === userInfo.uid,
        [uid, userInfo.uid]
    );

    const reactionsByEmoji: Record<string, IReaction[]> = React.useMemo(
        () => formatReactionsByEmoji(reactions),
        [reactions]
    );

    const handleUndoDeleteComment = React.useCallback(() => {
        dispatch(undoDeleteComment(comment.id)).finally(() =>
            setRecentlyArchived(false)
        );
    }, [comment.id, dispatch]);

    return (
        <div
            className={clsx({
                Comment: true,
                archived,
            })}
        >
            <div className="Comment-top horizontal-space-between">
                <div className="Comment-top-left flex-row">
                    <UserAvatar uid={uid} tiny />
                    <UserName uid={uid} />
                    <StyledText size="xsmall" color="lightest" cursor="default">
                        {fromNow(createdAt)}
                    </StyledText>
                    {createdAt === updatedAt ? null : (
                        <StyledText
                            size="xsmall"
                            color="lightest-0"
                            cursor="default"
                            isItalic
                        >
                            {archived ? 'deleted' : 'updated'}{' '}
                            {fromNow(updatedAt)}
                        </StyledText>
                    )}
                </div>
                <div className="Comment-top-right flex-row">
                    {isBeingEdited ? (
                        <StyledText
                            className="mr4"
                            color="accent"
                            weight="bold"
                            isItalic
                            cursor="default"
                        >
                            editing
                        </StyledText>
                    ) : null}
                    {isBeingRepliedTo ? (
                        <span
                            onClick={onReplyingToClick}
                            aria-label="Cancel Reply To"
                            data-balloon-pos="up"
                        >
                            <StyledText
                                className="mr8"
                                color="accent"
                                weight="bold"
                                isItalic
                                cursor="pointer"
                            >
                                replying to
                            </StyledText>
                        </span>
                    ) : null}
                    <div className="Comment-top-right-buttons flex-row">
                        {archived || isDeleting ? null : (
                            <>
                                {isAuthor && !isBeingEdited ? (
                                    <div className="Comment-edit">
                                        <IconButton
                                            icon="Edit"
                                            invertCircle
                                            size={18}
                                            tooltip="Edit Comment"
                                            tooltipPos="left"
                                            onClick={() => editComment(text)}
                                        />
                                        <IconButton
                                            className="ml8"
                                            icon="Trash"
                                            invertCircle
                                            size={18}
                                            tooltip="Delete Comment"
                                            tooltipPos="left"
                                            onClick={() => {
                                                setIsDeleting(true);
                                                deleteComment().then(() => {
                                                    setRecentlyArchived(true);
                                                    setIsDeleting(false);
                                                });
                                            }}
                                        />
                                    </div>
                                ) : null}
                                {isChild ? null : (
                                    <div className="ml8">
                                        <IconButton
                                            icon="MessageCircle"
                                            invertCircle
                                            size={18}
                                            tooltip="Reply to comment"
                                            tooltipPos="left"
                                            onClick={onCreateChildComment}
                                        />
                                    </div>
                                )}
                                <div className="mh8">
                                    <AddReactionButton
                                        reactionsByEmoji={reactionsByEmoji}
                                        commentId={id}
                                        uid={userInfo.uid}
                                    />
                                </div>
                            </>
                        )}
                        {recentlyArchived ? (
                            <IconButton
                                className="ml8"
                                icon="RotateCcw"
                                invertCircle
                                size={18}
                                tooltip="Undo Delete Comment"
                                tooltipPos="left"
                                onClick={handleUndoDeleteComment}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="Comment-text mt4">
                {archived ? (
                    <StyledText
                        className="mr4"
                        color="lightest"
                        isItalic
                        cursor="default"
                    >
                        this comment has been deleted
                    </StyledText>
                ) : (
                    <>
                        <RichTextEditor value={text} readOnly={true} />
                        {reactions.length ? (
                            <Reactions
                                reactionsByEmoji={reactionsByEmoji}
                                commentId={id}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};
