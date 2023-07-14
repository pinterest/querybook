import clsx from 'clsx';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReaction } from 'const/comment';
import {
    addReactionByCommentId,
    deleteReactionByCommentId,
} from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';

interface IProps {
    commentId: number;
    reactionsByEmoji: Record<string, IReaction[]>;
}

export const Reactions: React.FunctionComponent<IProps> = ({
    commentId,
    reactionsByEmoji,
}) => {
    const dispatch: Dispatch = useDispatch();
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    const [isLoadingEmoji, setIsLoadingEmoji] = React.useState<string | null>(
        null
    );

    const addEmoji = React.useCallback(
        (emoji: string) =>
            dispatch(addReactionByCommentId(commentId, emoji)).then(() =>
                setIsLoadingEmoji(null)
            ),
        [commentId, dispatch]
    );
    const deleteEmoji = React.useCallback(
        (reactionId) => {
            dispatch(deleteReactionByCommentId(commentId, reactionId)).then(
                () => setIsLoadingEmoji(null)
            );
        },
        [dispatch, commentId]
    );

    const handleReactionClick = (emoji: string, uid: number) => {
        const existingReaction = reactionsByEmoji[emoji].find(
            (reaction) => reaction.created_by === uid
        );
        setIsLoadingEmoji(emoji);
        if (existingReaction) {
            deleteEmoji(existingReaction.id);
        } else {
            addEmoji(emoji);
        }
    };

    return (
        <div className="Reactions mt8 flex-row">
            {Object.entries(reactionsByEmoji).map(([emoji, reactions]) => {
                const uids = reactions.map((reaction) => reaction.created_by);
                const reactionClassnames = clsx(
                    'Reaction',
                    'flex-row',
                    'mr8',
                    'ph8',
                    uids.includes(userInfo.uid) && 'active'
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
                            {isLoadingEmoji === emoji ? (
                                <Icon name="Loading" size={12} />
                            ) : (
                                uids.length
                            )}
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
