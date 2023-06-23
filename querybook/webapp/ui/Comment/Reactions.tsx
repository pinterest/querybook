import clsx from 'clsx';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReaction } from 'const/comment';
import {
    addReactionByCommentId,
    deleteReactionByCommentId,
} from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';

interface IProps {
    commentId: number;
    reactionsByEmoji: Record<number, IReaction[]>;
}

export const Reactions: React.FunctionComponent<IProps> = ({
    commentId,
    reactionsByEmoji,
}) => {
    const dispatch: Dispatch = useDispatch();
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    const addEmoji = React.useCallback(
        (emoji: string) => dispatch(addReactionByCommentId(commentId, emoji)),
        [commentId, dispatch]
    );
    const deleteEmoji = React.useCallback(
        (reactionId) => {
            dispatch(deleteReactionByCommentId(commentId, reactionId));
        },
        [dispatch, commentId]
    );

    const handleReactionClick = (emoji: string, uid: number) => {
        const existingReaction = reactionsByEmoji[emoji].find(
            (reaction) =>
                reaction.reaction === emoji && reaction.created_by === uid
        );
        if (existingReaction) {
            deleteEmoji(existingReaction.id);
        } else {
            addEmoji(emoji);
        }
    };

    return (
        <div className="Reactions mt8 flex-row">
            {Object.entries(reactionsByEmoji).map(([emoji, uids]) => {
                const reactionClassnames = clsx(
                    'Reaction',
                    'flex-row',
                    'mr8',
                    'ph8',
                    userInfo.uid in uids && 'active'
                );
                return (
                    <div
                        className={reactionClassnames}
                        key={emoji}
                        onClick={() => handleReactionClick(emoji, userInfo.uid)}
                    >
                        <StyledText size="smedium">{emoji}</StyledText>
                        <StyledText
                            weight="bold"
                            color="lightest"
                            className="ml8"
                            size="small"
                            cursor="default"
                        >
                            {uids.length}
                        </StyledText>
                    </div>
                );
            })}
            <AddReactionButton
                reactionsByEmoji={reactionsByEmoji}
                popoverLayout={['bottom', 'left']}
                tooltipPos="right"
                commentId={commentId}
                uid={userInfo.uid}
            />
        </div>
    );
};
