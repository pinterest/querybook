import { AxiosError } from 'axios';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardRightSidebar } from 'components/BoardRightSidebar/BoardRightSidebar';
import { IBoardItem, IBoardWithItemIds } from 'const/board';
import { BoardPageContext, IBoardPageContextType } from 'context/BoardPage';
import { useBoardItemActions } from 'hooks/board/useBoardItemActions';
import { isAxiosError } from 'lib/utils/error';
import {
    fetchBoardIfNeeded,
    getBoardEditors,
    setCurrentBoardId,
} from 'redux/board/action';
import * as boardSelectors from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { Loading } from 'ui/Loading/Loading';
import { AccentText, EmptyText } from 'ui/StyledText/StyledText';

import { BoardBoardItem } from './BoardBoardItem';
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
    const isEditable = useSelector(boardSelectors.canCurrentUserEditSelector);

    const [defaultCollapse, setDefaulCollapse] = React.useState(false);
    // TODO - meowcodes: implement isEditable + board 0
    const [isEditMode, setIsEditMode] = React.useState(false);

    const { handleDeleteBoardItem, handleMoveBoardItem } =
        useBoardItemActions(board);

    const boardContextValue: IBoardPageContextType = React.useMemo(
        () => ({
            onDeleteBoardItem: handleDeleteBoardItem,
            isEditMode,
            isCollapsed: defaultCollapse,
        }),
        [handleDeleteBoardItem, isEditMode, defaultCollapse]
    );

    const isPublicList = board.id === 0;

    let boardItemDOM: React.ReactNode;
    if (isPublicList) {
        boardItemDOM = board.boards?.map((boardId) => (
            <BoardBoardItem boardId={boardId} key={boardId} />
        ));
    } else {
        const boardItems =
            board?.items
                ?.map((itemIdx) => boardItemById[itemIdx])
                .filter((i) => i) ?? [];

        if (boardItems.length === 0) {
            boardItemDOM = (
                <EmptyText className="mt24">No items in board.</EmptyText>
            );
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
                        renderItem={(_, boardItem) =>
                            boardItemRenderer(boardItem)
                        }
                        onMove={handleMoveBoardItem}
                    />
                );
            } else {
                boardItemDOM = boardItems.map(boardItemRenderer);
            }
        }
    }

    return (
        <BoardPageContext.Provider value={boardContextValue}>
            <div className="Board">
                <div className="Board-content">
                    {isPublicList ? (
                        <AccentText
                            className="p8"
                            color="light"
                            size="xlarge"
                            weight="extra"
                        >
                            All Public Lists
                        </AccentText>
                    ) : (
                        <BoardHeader board={board} isEditable={isEditable} />
                    )}
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
        dispatch(setCurrentBoardId(boardId));
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
