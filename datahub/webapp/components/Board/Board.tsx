import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDataDocIfNeeded } from 'redux/dataDoc/action';
import { fetchDataTableIfNeeded } from 'redux/dataSources/action';
import { BoardDataDocItem } from './BoardDataDocItem';
import { BoardDataTableItem } from './BoardDataTableItem';
import { Dispatch, IStoreState } from 'redux/store/types';

import './Board.scss';
import { fetchBoardIfNeeded } from 'redux/board/action';

interface IProps {
    boardId: number;
}

export const Board: React.FunctionComponent<IProps> = ({ boardId }) => {
    const { board, boardItemById } = useSelector((state: IStoreState) => ({
        board: state.board.boardById[boardId],
        boardItemById: state.board.boardItemById,
    }));

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchBoardIfNeeded(boardId));
    }, [boardId]);

    const boardItemDOM = board?.items
        ?.map((itemIdx) => boardItemById?.[itemIdx])
        .filter((i) => i)
        .map((boardItem) =>
            boardItem.data_doc_id ? (
                <BoardDataDocItem
                    docId={boardItem.data_doc_id}
                    key={boardItem.id}
                />
            ) : (
                <BoardDataTableItem
                    tableId={boardItem.table_id}
                    key={boardItem.id}
                />
            )
        );

    return <div className="Board m48">{boardItemDOM}</div>;
};
