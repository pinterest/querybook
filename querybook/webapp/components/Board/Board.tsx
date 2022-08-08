import { AxiosError } from 'axios';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardRightSidebar } from 'components/BoardRightSidebar/BoardRightSidebar';
import { IBoardItem, IBoardWithItemIds } from 'const/board';
import { BoardPageContext, IBoardPageContextType } from 'context/BoardPage';
import { useBoardItemActions } from 'hooks/board/useBoardItemActions';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { isAxiosError } from 'lib/utils/error';
import { fetchBoardIfNeeded, getBoardEditors } from 'redux/board/action';
import * as boardSelectors from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { Loading } from 'ui/Loading/Loading';
import { EmptyText } from 'ui/StyledText/StyledText';

import { BoardBoardItem } from './BoardBoardItem';
import { BoardBreadcrumbs } from './BoardBreadcrumbs';
import { BoardDataDocItem } from './BoardDataDocItem';
import { BoardDataTableItem } from './BoardDataTableItem';
import { BoardError } from './BoardError';
import { BoardHeader } from './BoardHeader';
import { BoardQueryItem } from './BoardQueryItem';

import './Board.scss';

interface IBoardDOMProps {
    board: IBoardWithItemIds;
    boardItemById: Record<number, IBoardItem>;
}

const BoardDOM: React.FunctionComponent<IBoardDOMProps> = ({
    board,
    boardItemById,
}) => {
    useBrowserTitle(board.name);
    const isEditable = useSelector((state: IStoreState) =>
        boardSelectors.canCurrentUserEditSelector(state, board.id)
    );

    const [defaultCollapse, setDefaulCollapse] = React.useState(false);
    const [isEditMode, setIsEditMode] = React.useState(false);

    const { handleDeleteBoardItem, handleMoveBoardItem } =
        useBoardItemActions(board);

    const boardContextValue: IBoardPageContextType = React.useMemo(
        () => ({
            onDeleteBoardItem: handleDeleteBoardItem,
            isEditMode,
            isCollapsed: defaultCollapse,
            boardId: board.id,
        }),
        [handleDeleteBoardItem, isEditMode, defaultCollapse, board.id]
    );

    let boardItemDOM: React.ReactNode;

    const boardItems =
        board?.items
            ?.map((itemIdx) => boardItemById[itemIdx])
            .filter((i) => i) ?? [];

    if (boardItems.length === 0) {
        boardItemDOM = <EmptyText className="mt36">No list items</EmptyText>;
    } else {
        const boardItemRenderer = (boardItem: IBoardItem) =>
            boardItem.data_doc_id ? (
                <BoardDataDocItem
                    itemId={boardItem.id}
                    key={boardItem.id}
                    docId={boardItem.data_doc_id}
                />
            ) : boardItem.table_id ? (
                <BoardDataTableItem
                    itemId={boardItem.id}
                    key={boardItem.id}
                    tableId={boardItem.table_id}
                />
            ) : boardItem.board_id ? (
                <BoardBoardItem
                    itemId={boardItem.id}
                    key={boardItem.id}
                    boardId={boardItem.board_id}
                />
            ) : (
                <BoardQueryItem
                    itemId={boardItem.id}
                    key={boardItem.id}
                    queryExecutionId={boardItem.query_execution_id}
                />
            );

        if (isEditMode) {
            boardItemDOM = (
                <DraggableList
                    items={boardItems}
                    renderItem={(_, boardItem) => boardItemRenderer(boardItem)}
                    onMove={handleMoveBoardItem}
                />
            );
        } else {
            boardItemDOM = boardItems.map(boardItemRenderer);
        }
    }

    return (
        <BoardPageContext.Provider value={boardContextValue}>
            <div className="Board">
                <div className="Board-content">
                    <BoardBreadcrumbs />
                    <BoardHeader board={board} isEditable={isEditable} />
                    {boardItemDOM}
                </div>
                <BoardRightSidebar
                    onCollapse={() => setDefaulCollapse((c) => !c)}
                    defaultCollapse={defaultCollapse}
                    onEditModeToggle={() => setIsEditMode((e) => !e)}
                    isEditMode={isEditMode}
                    isEditable={isEditable}
                />
            </div>
        </BoardPageContext.Provider>
    );
};

interface IBoardProps {
    boardId: number;
}

export const Board: React.FunctionComponent<IBoardProps> = ({ boardId }) => {
    const { board, boardItemById } = useSelector((state: IStoreState) => ({
        board: state.board.boardById[boardId],
        boardItemById: state.board.boardItemById,
    }));

    const dispatch: Dispatch = useDispatch();

    const [error, setError] = React.useState<AxiosError>(null);

    React.useEffect(() => {
        dispatch(fetchBoardIfNeeded(boardId)).then(null, (e) => {
            if (isAxiosError(e)) {
                setError(e);
            }
        });
        dispatch(getBoardEditors(boardId));
    }, [boardId]);

    return error ? (
        <BoardError errorObj={error} boardId={boardId} />
    ) : board ? (
        <BoardDOM board={board} boardItemById={boardItemById} />
    ) : (
        <Loading fullHeight />
    );
};
