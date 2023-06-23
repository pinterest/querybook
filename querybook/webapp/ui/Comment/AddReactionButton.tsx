import * as React from 'react';
import { useDispatch } from 'react-redux';

import { IReaction } from 'const/comment';
import { TooltipDirection } from 'const/tooltip';
import {
    addReactionByCommentId,
    deleteReactionByCommentId,
} from 'redux/comment/action';
import { Dispatch } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';

interface IProps {
    commentId: number;
    popoverLayout?: PopoverLayout;
    tooltipPos?: TooltipDirection;
    uid: number;
    reactionByEmoji: Record<number, IReaction[]>;
}
interface IEmojiListProps {
    onClick: (emoji: string) => void;
}

const emojis = ['👍', '👀', '🙂', '😍', '🙁', '❌', '🤌', '🌟', '🔥', '🩵'];

const EmojiList: React.FunctionComponent<IEmojiListProps> = ({ onClick }) => (
    <div className="EmojiList flex-row">
        {emojis.map((emoji) => (
            <div
                key={emoji}
                className="Emoji mh8"
                onClick={() => onClick(emoji)}
            >
                {emoji}
            </div>
        ))}
    </div>
);

export const AddReactionButton: React.FunctionComponent<IProps> = ({
    commentId,
    reactionByEmoji,
    uid,
    popoverLayout = ['bottom', 'right'],
    tooltipPos = 'down',
}) => {
    const dispatch: Dispatch = useDispatch();
    const addReactionButtonRef = React.useRef<HTMLAnchorElement>();

    const [showEmojis, setShowEmojis] = React.useState(false);

    const handleEmojiClick = React.useCallback(
        (emoji: string) => {
            const existingReaction = reactionByEmoji[emoji]?.find(
                (reaction) => reaction.created_by === uid
            );
            if (existingReaction) {
                dispatch(
                    deleteReactionByCommentId(commentId, existingReaction.id)
                );
            } else {
                dispatch(addReactionByCommentId(commentId, emoji));
            }
        },
        [commentId, dispatch, uid, reactionByEmoji]
    );

    return (
        <div className="AddReactionButton">
            <IconButton
                icon="Plus"
                invertCircle
                size={18}
                tooltip="React"
                tooltipPos={tooltipPos}
                ref={addReactionButtonRef}
                onClick={() => setShowEmojis(true)}
            />
            {showEmojis ? (
                <Popover
                    onHide={() => setShowEmojis(false)}
                    anchor={addReactionButtonRef.current}
                    layout={popoverLayout}
                    hideArrow
                    noPadding
                >
                    <EmojiList onClick={handleEmojiClick} />
                </Popover>
            ) : null}
        </div>
    );
};
