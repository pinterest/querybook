import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchBoardIfNeeded } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardItem } from './BoardItem';

interface IProps {
    parentBoardId: number;
    itemId?: number;
    boardId: number;
    isCollapsed: boolean;
    isEditMode: boolean;
}

export const BoardBoardItem: React.FunctionComponent<IProps> = ({
    parentBoardId,
    itemId,
    boardId,
    isCollapsed,
    isEditMode,
}) => {
    const board = useSelector(
        (state: IStoreState) => state.board.boardById[boardId]
    );

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchBoardIfNeeded(boardId));
    }, [boardId]);

    return (
        <BoardItem
            boardId={parentBoardId}
            boardItemId={itemId}
            itemId={boardId}
            itemType="board"
            title={board?.name}
            titleUrl={`/list/${boardId}/`}
            defaultCollapsed={isCollapsed}
            isEditMode={isEditMode}
        />
    );
};
