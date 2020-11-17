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
        board?.tables.map((tableId) => {
            dispatch(fetchDataTableIfNeeded(tableId));
        });
        board?.docs.map((docId) => {
            dispatch(fetchDataDocIfNeeded(docId));
        });
    }, []);

    const boardItemDOM = board?.items?.map((itemIdx) => {
        const item = boardItemById?.[itemIdx];
        if (!item) {
            return null;
        }
        if (item.data_doc_id) {
            return (
                <BoardDataDocItem
                    docId={item.data_doc_id}
                    key={item.data_doc_id}
                />
            );
        } else {
            return (
                <BoardDataTableItem
                    tableId={item.table_id}
                    key={item.table_id}
                />
            );
        }
    });

    return <div className="Board m48">{boardItemDOM}</div>;
};
