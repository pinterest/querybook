import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchBoardIfNeeded } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IBoardWithItemIds, IBoardItem } from 'const/board';

import { BoardDataDocItem } from './BoardDataDocItem';
import { BoardDataTableItem } from './BoardDataTableItem';
import { BoardError } from './BoardError';
import { Title } from 'ui/Title/Title';

import './Board.scss';

interface IBoardProps {
    boardId: number;
}

interface IBoardDOMProps {
    board: IBoardWithItemIds;
    boardItemById: Record<number, IBoardItem>;
}

export const Board: React.FunctionComponent<IBoardProps> = ({ boardId }) => {
    const { board, boardItemById } = useSelector((state: IStoreState) => ({
        board: state.board.boardById[boardId],
        boardItemById: state.board.boardItemById,
    }));

    const dispatch: Dispatch = useDispatch();

    const [error, setError] = React.useState(null);

    const getBoard = React.useCallback(async () => {
        const resp = await dispatch(fetchBoardIfNeeded(boardId));
        if (resp instanceof Error) {
            setError(resp);
        }
    }, [boardId]);

    React.useEffect(() => {
        getBoard();
    }, [getBoard]);

    return error ? (
        <BoardError errorObj={error} boardId={boardId} />
    ) : (
        <BoardDOM board={board} boardItemById={boardItemById} />
    );
};

const BoardDOM: React.FunctionComponent<IBoardDOMProps> = ({
    board,
    boardItemById,
}) => {
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

    return (
        <div className="Board mv24 mh48">
            <div className="Board-top ml4">
                <Title>{board?.name}</Title>
                <div className="Board-desc">{board?.description}</div>
            </div>
            {boardItemDOM}
        </div>
    );
};
