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
    reactions: IReaction[];
}

export const Reactions: React.FunctionComponent<IProps> = ({
    commentId,
    reactions: reactionsProp,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [uidsByReaction, setUidsByReaction] = React.useState<
        Record<string, number[]>
    >({});
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    const formatReactions = React.useCallback((reactions: IReaction[]) => {
        const formattedReactions = {};
        reactions.forEach((reaction) => {
            formattedReactions[reaction.reaction] =
                formattedReactions[reaction.reaction] ?? [];
            formattedReactions[reaction.reaction].push(reaction.created_by);
        });
        return formattedReactions;
    }, []);

    React.useEffect(() => {
        if (reactionsProp) {
            setUidsByReaction(formatReactions(reactionsProp));
        }
    }, [formatReactions, reactionsProp]);

    const addEmoji = React.useCallback(
        (emoji: string) => dispatch(addReactionByCommentId(commentId, emoji)),
        [commentId, dispatch]
    );
    const deleteEmoji = React.useCallback(
        (emoji, uid) => {
            const reactionToDelete = reactionsProp.find(
                (reaction) =>
                    reaction.reaction === emoji && reaction.created_by === uid
            );
            if (reactionToDelete) {
                dispatch(
                    deleteReactionByCommentId(commentId, reactionToDelete.id)
                );
            }
        },
        [commentId, dispatch, reactionsProp]
    );

    const handleReactionClick = (reaction: string, uid: number) => {
        // TODO: make this work (with backend)
        const uidIdx = uidsByReaction[reaction].findIndex(
            (uid) => uid === userInfo.uid
        );
        if (uidIdx === -1) {
            addEmoji(reaction);
        } else {
            deleteEmoji(reaction, uid);
        }
    };

    return (
        <div className="Reactions mt8 flex-row">
            {Object.entries(uidsByReaction).map(([emoji, uids]) => {
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
                popoverLayout={['bottom', 'left']}
                tooltipPos="right"
                commentId={commentId}
            />
        </div>
    );
};
