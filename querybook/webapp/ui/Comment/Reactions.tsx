import clsx from 'clsx';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReaction } from 'const/comment';
import {
    addReactionForCellComment,
    addReactionForTableComment,
    deleteReactionForCellComment,
    deleteReactionForTableComment,
} from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';

interface IProps {
    cellId?: number;
    tableId?: number;
    commentId: number;
    reactions: IReaction[];
}

export const Reactions: React.FunctionComponent<IProps> = ({
    cellId,
    tableId,
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
            formattedReactions[reaction.reaction].push(reaction.uid);
        });
        return formattedReactions;
    }, []);

    React.useEffect(() => {
        if (reactionsProp) {
            setUidsByReaction(formatReactions(reactionsProp));
        }
    }, [formatReactions, reactionsProp]);

    // TODO: refactor to custom hook + add support for child comment reaction
    const addEmoji = React.useCallback(
        (emoji) =>
            cellId
                ? dispatch(addReactionForCellComment(cellId, commentId, emoji))
                : dispatch(
                      addReactionForTableComment(tableId, commentId, emoji)
                  ),
        [cellId, commentId, dispatch, tableId]
    );
    const deleteEmoji = React.useCallback(
        (emoji) =>
            cellId
                ? dispatch(
                      deleteReactionForCellComment(cellId, commentId, emoji)
                  )
                : dispatch(
                      deleteReactionForTableComment(tableId, commentId, emoji)
                  ),
        [cellId, commentId, dispatch, tableId]
    );

    const handleReactionClick = (reaction: string) => {
        // TODO: make this work (with backend)
        const uidIdx = uidsByReaction[reaction].findIndex(
            (uid) => uid === userInfo.uid
        );
        if (uidIdx === -1) {
            addEmoji(reaction);
        } else {
            deleteEmoji(reaction);
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
                        onClick={() => handleReactionClick(emoji)}
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
                cellId={cellId}
                tableId={tableId}
                commentId={commentId}
            />
        </div>
    );
};
