import * as React from 'react';
import { useDispatch } from 'react-redux';

import { TooltipDirection } from 'const/tooltip';
import {
    addReactionForCellComment,
    addReactionForTableComment,
} from 'redux/comment/action';
import { Dispatch } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';

interface IProps {
    cellId?: number;
    tableId?: number;
    commentId: number;
    popoverLayout?: PopoverLayout;
    tooltipPos?: TooltipDirection;
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
    cellId,
    tableId,
    commentId,
    popoverLayout = ['bottom', 'right'],
    tooltipPos = 'down',
}) => {
    const dispatch: Dispatch = useDispatch();
    const addReactionButtonRef = React.useRef<HTMLAnchorElement>();

    const [showEmojis, setShowEmojis] = React.useState(false);

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

    const handleEmojiClick = React.useCallback(
        (emoji: string) => {
            addEmoji(emoji);
        },
        [addEmoji]
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
