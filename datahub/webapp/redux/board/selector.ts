import { createSelector } from 'reselect';
import { IStoreState } from 'redux/store/types';
import { currentEnvironmentSelector } from 'redux/environment/selector';

const boardByIdSelector = (state: IStoreState) => state.board.boardById;
const boardToItemsIdSelector = (state: IStoreState, boardId: number) =>
    state.board.boardIdToItemsId[boardId];

export const boardsSelector = createSelector(
    boardByIdSelector,
    currentEnvironmentSelector,
    (boardById, environment) =>
        Object.values(boardById)
            .filter((board) => board.environment_id === environment?.id)
            .sort((a, b) => b.updated_at - a.updated_at)
);

export const boardDataDocSelector = createSelector(
    boardToItemsIdSelector,
    (state: IStoreState) => state.dataDoc.dataDocById,
    (boardToItemsId, dataDocById) => {
        return (boardToItemsId?.docs || [])
            .map((docId) => dataDocById[docId])
            .filter((doc) => doc);
    }
);

export const boardTableSelector = createSelector(
    boardToItemsIdSelector,
    (state: IStoreState) => state.dataSources.dataTablesById,
    (boardToItemsId, dataTablesById) => {
        return (boardToItemsId?.tables || [])
            .map((tableId) => dataTablesById[tableId])
            .filter((table) => table);
    }
);
