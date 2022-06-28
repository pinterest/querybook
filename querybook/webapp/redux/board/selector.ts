import { createSelector } from 'reselect';

import { IBoard, IBoardItem } from 'const/board';
import { IDataDoc } from 'const/datadoc';
import { IDataTable } from 'const/metastore';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IStoreState } from 'redux/store/types';
import { myUserInfoSelector } from 'redux/user/selector';

const boardByIdSelector = (state: IStoreState) => state.board.boardById;
const boardItemByIdSelector = (state: IStoreState) => state.board.boardItemById;
const boardSelector = (state: IStoreState, boardId: number) =>
    state.board.boardById[boardId];

export const myBoardsSelector = createSelector(
    boardByIdSelector,
    currentEnvironmentSelector,
    myUserInfoSelector,
    (boardById, environment, userInfo) =>
        Object.values(boardById)
            .filter(
                (board) =>
                    board.environment_id === environment?.id &&
                    userInfo.id === board.owner_uid
            )
            .sort((a, b) => b.updated_at - a.updated_at)
);

const rawBoardItemsSelector = createSelector(
    boardSelector,
    boardItemByIdSelector,
    (board, boardItemById) =>
        (board?.items ?? [])
            .map((itemId) => boardItemById[itemId])
            .filter((item) => item)
);

export const makeBoardItemsSelector = () =>
    createSelector(
        rawBoardItemsSelector,
        (state: IStoreState) => state.dataDoc.dataDocById,
        (state: IStoreState) => state.dataSources.dataTablesById,
        (state: IStoreState) => state.board.boardById,
        (boardItems, dataDocById, dataTablesById, boardById) =>
            boardItems
                .map((item) => {
                    if (item['data_doc_id'] != null) {
                        return [item, dataDocById[item.data_doc_id]] as [
                            IBoardItem,
                            IDataDoc
                        ];
                    } else if (item['table_id'] != null) {
                        return [item, dataTablesById[item.table_id]] as [
                            IBoardItem,
                            IDataTable
                        ];
                    } else {
                        return [item, boardById[item.board_id]] as [
                            IBoardItem,
                            IBoard
                        ];
                    }
                })
                .map((item) => ({
                    boardItem: item[0],
                    itemData: item[1],
                    id: item[0].id,
                }))
    );

export const publicBoardItemsSelector = () =>
    createSelector(
        boardSelector,
        (state: IStoreState) => state.board.boardById,
        (board, boardById) =>
            board?.boards
                ?.map(
                    (boardId) =>
                        [{ id: boardId }, boardById[boardId]] as [
                            { id: number },
                            IBoard
                        ]
                )
                .map((item) => ({
                    boardItem: item[0],
                    itemData: item[1],
                    id: item[0].id,
                }))
    );
