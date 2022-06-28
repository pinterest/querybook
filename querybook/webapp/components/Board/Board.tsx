import { AxiosError } from 'axios';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IBoardItem, IBoardWithItemIds } from 'const/board';
import { isAxiosError } from 'lib/utils/error';
import { fetchBoardIfNeeded } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardRightSidebar } from 'components/BoardRightSidebar/BoardRightSidebar';
import { BoardDataDocItem } from './BoardDataDocItem';
import { BoardDataTableItem } from './BoardDataTableItem';
import { BoardBoardItem } from './BoardBoardItem';
import { BoardError } from './BoardError';
import { BoardHeader } from './BoardHeader';

import { Loading } from 'ui/Loading/Loading';
import { AccentText } from 'ui/StyledText/StyledText';

import './Board.scss';
import { BoardQueryItem } from './BoardQueryItem';

interface IBoardDOMProps {
    board: IBoardWithItemIds;
    boardItemById: Record<number, IBoardItem>;
}

const BoardDOM: React.FunctionComponent<IBoardDOMProps> = ({
    board,
    boardItemById,
}) => {
    const [defaultCollapse, setDefaulCollapse] = React.useState(false);
    // TODO - meowcodes: implement isEditable + board 0
    const [isEditMode, setIsEditMode] = React.useState<boolean>(false);

    const isPublicList = React.useMemo(() => board.id === 0, [board]);

    const boardItemDOM = isPublicList
        ? board.boards?.map((boardId) => (
              <BoardBoardItem
                  parentBoardId={0}
                  boardId={boardId}
                  key={boardId + 'board'}
                  isCollapsed={defaultCollapse}
                  isEditMode={isEditMode}
              />
          ))
        : board?.items
              ?.map((itemIdx) => boardItemById?.[itemIdx])
              .filter((i) => i)
              ?.map((boardItem) =>
                  boardItem.data_doc_id ? (
                      <BoardDataDocItem
                          boardId={board.id}
                          itemId={boardItem.id}
                          docId={boardItem.data_doc_id}
                          key={boardItem.id + 'doc'}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  ) : boardItem.table_id ? (
                      <BoardDataTableItem
                          boardId={board.id}
                          itemId={boardItem.id}
                          tableId={boardItem.table_id}
                          key={boardItem.id + 'table'}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  ) : boardItem.board_id ? (
                      <BoardBoardItem
                          parentBoardId={board.id}
                          itemId={boardItem.id}
                          boardId={boardItem.board_id ?? boardItem.id}
                          key={(boardItem.board_id ?? boardItem.id) + 'board'}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  ) : (
                      <BoardQueryItem
                          boardId={board.id}
                          itemId={boardItem.id}
                          queryExecutionId={boardItem.query_execution_id}
                          key={boardItem.id + 'query'}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  )
              );

    return (
        <div className="Board">
            <div className="Board-left" />
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
                    <BoardHeader board={board} />
                )}
                {boardItemDOM}
            </div>
            <BoardRightSidebar
                onCollapse={() => setDefaulCollapse((c) => !c)}
                defaultCollapse={defaultCollapse}
                onEditModeToggle={() => setIsEditMode((e) => !e)}
                isEditMode={isEditMode}
            />
        </div>
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
    }, [boardId]);

    return error ? (
        <BoardError errorObj={error} boardId={boardId} />
    ) : board ? (
        <BoardDOM board={board} boardItemById={boardItemById} />
    ) : (
        <Loading fullHeight />
    );
};
