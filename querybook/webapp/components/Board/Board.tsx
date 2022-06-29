import { AxiosError } from 'axios';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardRightSidebar } from 'components/BoardRightSidebar/BoardRightSidebar';
import { IBoardItem, IBoardWithItemIds } from 'const/board';
import { isAxiosError } from 'lib/utils/error';
import { fetchBoardIfNeeded } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Loading } from 'ui/Loading/Loading';
import { AccentText } from 'ui/StyledText/StyledText';

import { BoardBoardItem } from './BoardBoardItem';
import { BoardDataDocItem } from './BoardDataDocItem';
import { BoardDataTableItem } from './BoardDataTableItem';
import { BoardError } from './BoardError';
import { BoardHeader } from './BoardHeader';

import './Board.scss';

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

    const isPublicList = board.id === 0;

    const boardItemDOM = isPublicList
        ? board.boards?.map((boardId) => (
              <BoardBoardItem
                  boardId={boardId}
                  key={boardId}
                  isCollapsed={defaultCollapse}
                  isEditMode={isEditMode}
              />
          ))
        : board?.items
              ?.map((itemIdx) => boardItemById[itemIdx])
              .filter((i) => i)
              .map((boardItem) =>
                  boardItem.data_doc_id ? (
                      <BoardDataDocItem
                          docId={boardItem.data_doc_id}
                          key={boardItem.id}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  ) : boardItem.table_id ? (
                      <BoardDataTableItem
                          tableId={boardItem.table_id}
                          key={boardItem.id}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  ) : (
                      <BoardBoardItem
                          boardId={boardItem.board_id ?? boardItem.id}
                          key={boardItem.board_id ?? boardItem.id}
                          isCollapsed={defaultCollapse}
                          isEditMode={isEditMode}
                      />
                  )
              );

    return (
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
