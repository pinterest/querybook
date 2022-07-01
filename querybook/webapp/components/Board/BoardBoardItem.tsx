import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchBoardIfNeeded } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardItem } from './BoardItem';

interface IProps {
    itemId?: number;
    boardId: number;
}

export const BoardBoardItem: React.FunctionComponent<IProps> = ({
    itemId,
    boardId,
}) => {
    const board = useSelector(
        (state: IStoreState) => state.board.boardById[boardId]
    );

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchBoardIfNeeded(boardId));
    }, [dispatch, boardId]);

    return board ? (
        <BoardItem
            boardItemId={itemId}
            itemId={boardId}
            itemType="board"
            title={board?.name}
            titleUrl={`/list/${boardId}/`}
        />
    ) : null;
};
