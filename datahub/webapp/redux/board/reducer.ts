import { IBoardState, BoardAction } from './types';
import { combineReducers } from 'redux';
import produce from 'immer';

const initialState: Readonly<IBoardState> = {
    boardById: {},
    boardIdToItemsId: {},
};

function board(state = initialState, action: BoardAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@board/RECEIVE_BOARDS': {
                const { boardById } = action.payload;
                for (const [id, board] of Object.entries(boardById)) {
                    draft.boardById[id] = {
                        ...draft.boardById[id],
                        ...board,
                    };
                }
                return;
            }
            case '@@board/RECEIVE_BOARD_WITH_ITEMS': {
                const { tables, docs, ...board } = action.payload.board;

                draft.boardById[board.id] = {
                    ...draft.boardById[board.id],
                    ...board,
                };
                draft.boardIdToItemsId[board.id] = {
                    docs,
                    tables,
                };
                return;
            }
            case '@board/REMOVE_BOARD': {
                const { id } = action.payload;
                delete draft.boardById[id];
                delete draft.boardIdToItemsId[id];
                return;
            }
            case '@@board/RECEIVE_BOARD_ITEM': {
                const { boardId, itemType, itemId } = action.payload;
                if (boardId in draft.boardIdToItemsId) {
                    const boardItemIds =
                        itemType === 'data_doc'
                            ? draft.boardIdToItemsId[boardId].docs
                            : draft.boardIdToItemsId[boardId].tables;
                    if (!boardItemIds.includes(itemId)) {
                        boardItemIds.push(itemId);
                    }
                }
                return;
            }
            case '@@board/REMOVE_BOARD_ITEM': {
                const { boardId, itemType, itemId } = action.payload;
                if (boardId in draft.boardIdToItemsId) {
                    const boardItemIds =
                        itemType === 'data_doc'
                            ? draft.boardIdToItemsId[boardId].docs
                            : draft.boardIdToItemsId[boardId].tables;
                    const index = boardItemIds.indexOf(itemId);
                    if (index >= 0) {
                        boardItemIds.splice(index, 1);
                    }
                }
                return;
            }
        }
    });
}

export default board;
