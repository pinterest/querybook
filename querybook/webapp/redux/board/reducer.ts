import { itemTypeToKey } from 'const/board';
import produce from 'immer';

import { arrayMove } from 'lib/utils';

import { BoardAction, IBoardState } from './types';

const initialState: Readonly<IBoardState> = {
    boardById: {},
    boardItemById: {},
    currentBoardId: null,
};

export default function (state = initialState, action: BoardAction) {
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
                const { board, boardItemById } = action.payload;
                draft.boardById[board.id] = {
                    ...draft.boardById[board.id],
                    ...board,
                };
                draft.boardItemById = {
                    ...draft.boardItemById,
                    ...boardItemById,
                };

                return;
            }
            case '@board/REMOVE_BOARD': {
                const { id } = action.payload;
                delete draft.boardById[id];
                draft.boardItemById = Object.values(draft.boardItemById).reduce(
                    (hash, boardItem) => {
                        if (boardItem.parent_board_id !== id) {
                            hash[boardItem.id] = boardItem;
                        }
                        return hash;
                    },
                    {}
                );
                return;
            }
            case '@@board/RECEIVE_BOARD_ITEM': {
                const { boardItem, boardId, itemType, itemId } = action.payload;
                draft.boardItemById[boardItem.id] = boardItem;
                if (
                    draft.boardById[boardId].items &&
                    !(boardItem.id in draft.boardById[boardId].items) &&
                    itemType &&
                    itemId
                ) {
                    draft.boardById[boardId].items.push(boardItem.id);
                    draft.boardById[boardId][itemTypeToKey[itemType]].push(
                        itemId
                    );
                }

                return;
            }
            case '@@board/REMOVE_BOARD_ITEM': {
                const { boardId, itemType, itemId } = action.payload;
                const itemField =
                    itemType === 'data_doc'
                        ? 'data_doc_id'
                        : itemType === 'table'
                        ? 'table_id'
                        : 'board_id';

                const board = draft.boardById[boardId];

                draft.boardItemById = Object.values(draft.boardItemById).reduce(
                    (hash, boardItem) => {
                        if (
                            !(
                                boardItem.parent_board_id === boardId &&
                                itemField in boardItem &&
                                boardItem[itemField] === itemId
                            )
                        ) {
                            hash[boardItem.id] = boardItem;
                        } else {
                            board.items = board.items.filter(
                                (id) => id !== boardItem.id
                            );
                            board[itemTypeToKey[itemType]] = board[
                                itemTypeToKey[itemType]
                            ].filter((id) => id !== itemId);
                        }
                        return hash;
                    },
                    {}
                );
                return;
            }
            case '@@board/MOVE_BOARD_ITEM': {
                const { boardId, fromIndex, toIndex } = action.payload;
                const board = draft.boardById[boardId];
                board.items = arrayMove(board.items, fromIndex, toIndex);
                return;
            }
            case '@@board/UPDATE_BOARD_ITEM_DESCRIPTION': {
                const { boardItem } = action.payload;
                draft.boardItemById[boardItem.id] = boardItem;
                return;
            }
            case '@@board/SET_CURRENT_BOARD_ID': {
                const { boardId } = action.payload;
                draft.currentBoardId = boardId;
                return;
            }
        }
    });
}
