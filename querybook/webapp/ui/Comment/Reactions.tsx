import clsx from 'clsx';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { IStoreState } from 'redux/store/types';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';
import { IReaction } from './Comments';

interface IProps {
    reactions: IReaction[];
}

export const Reactions: React.FunctionComponent<IProps> = ({
    reactions: reactionsProp,
}) => {
    const [uidsByReaction, setUidsByReaction] = React.useState<
        Record<string, number[]>
    >({});
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    const formatReactions = React.useCallback((reactions: IReaction[]) => {
        const formattedReactions = {};
        for (const reaction of reactions) {
            if (reaction.reaction in formattedReactions) {
                formattedReactions[reaction.reaction] = [
                    ...formattedReactions[reaction.reaction],
                    reaction.uid,
                ];
            } else {
                formattedReactions[reaction.reaction] = [reaction.uid];
            }
        }
        return formattedReactions;
    }, []);

    React.useEffect(() => {
        if (reactionsProp) {
            setUidsByReaction(formatReactions(reactionsProp));
        }
    }, [formatReactions, reactionsProp]);

    const handleReactionClick = (reaction: string) => {
        // TODO: make this work (with backend)
        const uidIdx = uidsByReaction[reaction].findIndex(
            (uid) => uid === userInfo.uid
        );
        if (uidIdx === -1) {
            setUidsByReaction((curr) => ({
                ...curr,
                [reaction]: [...curr[reaction], userInfo.uid],
            }));
        } else {
            setUidsByReaction((curr) => {
                if (curr[reaction].length > 1) {
                    return {
                        ...curr,
                        [reaction]: curr[reaction].filter(
                            (uid) => uid !== userInfo.uid
                        ),
                    };
                }
                const { [reaction]: _, ...rest } = curr;
                return rest;
            });
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
                uid={userInfo.uid}
                popoverLayout={['bottom', 'left']}
                tooltipPos="right"
            />
        </div>
    );
};
