import React from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { BoardItemType, IBoard } from 'const/board';
import { deleteBoardItem, moveBoardItem } from 'redux/board/action';
import { Dispatch } from 'redux/store/types';

export function useBoardItemActions(board: IBoard) {
    const dispatch: Dispatch = useDispatch();
    const handleDeleteBoardItem = React.useCallback(
        async (itemId: number, itemType: BoardItemType) => {
            await dispatch(deleteBoardItem(board.id, itemType, itemId));
            toast.success(`Item removed from the list "${board.name}"`);
        },
        [dispatch, board]
    );

    const handleMoveBoardItem = React.useCallback(
        async (fromIndex: number, toIndex: number) => {
            if (fromIndex === toIndex) {
                return;
            }
            await dispatch(moveBoardItem(board.id, fromIndex, toIndex));
            toast.success(`Successfully moved list item`);
        },
        [dispatch, board]
    );

    return {
        handleDeleteBoardItem,
        handleMoveBoardItem,
    };
}
