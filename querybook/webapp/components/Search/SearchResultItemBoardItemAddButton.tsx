import * as React from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import { BoardItemType, itemTypeToKey } from 'const/board';
import { addBoardItem, deleteBoardItem } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { AccentText } from 'ui/StyledText/StyledText';

interface IProps {
    itemType: BoardItemType;
    itemId: number;
}

export const SearchResultItemBoardItemAddButton: React.FunctionComponent<
    IProps
> = ({ itemType, itemId }) => {
    const dispatch: Dispatch = useDispatch();
    const { currentBoardId, boardById } = useSelector((state: IStoreState) => ({
        currentBoardId: state.board.currentBoardId,
        boardById: state.board.boardById,
    }));

    const currentBoard = React.useMemo(
        () => currentBoardId && boardById[currentBoardId],
        [boardById, currentBoardId]
    );

    const itemInBoard = React.useMemo(
        () => currentBoard[itemTypeToKey[itemType]]?.includes(itemId),
        [currentBoard, itemId, itemType]
    );

    const handleAddItem = React.useCallback(async () => {
        if (!itemInBoard) {
            // Add item
            await dispatch(addBoardItem(currentBoardId, itemType, itemId));
            toast.success(`Item added to the list "${currentBoard.name}"!`);
        } else {
            // remove item
            await dispatch(deleteBoardItem(currentBoardId, itemType, itemId));
            toast.success(`Item removed from the list "${currentBoard.name}"!`);
        }
    }, [currentBoard, currentBoardId, itemId, itemType, itemInBoard]);

    return (
        <div className="flex-row" onClick={handleAddItem}>
            <IconButton
                icon={itemInBoard ? 'Minus' : 'Plus'}
                size={24}
                noPadding
                className="mr4"
            />
            <IconButton
                fill={true}
                color="light"
                icon="Briefcase"
                size={24}
                noPadding
            />
            <AccentText className="mh4">{currentBoard.name}</AccentText>
        </div>
    );
};
