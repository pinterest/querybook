import { ITagState, TagAction } from './types';
import { combineReducers } from 'redux';

const initialState: ITagState = {
    tagItemByTableId: {},
};

function tagItemByTableId(
    state = initialState.tagItemByTableId,
    action: TagAction
) {
    switch (action.type) {
        case '@@tag/RECEIVE_TAG_ITEMS': {
            const { tableId, tags } = action.payload;
            return {
                ...state,
                [tableId]: tags,
            };
        }
        case '@@tag/RECEIVE_TAG_ITEM': {
            const { tableId, tag } = action.payload;
            return {
                ...state,
                [tableId]: [...state[tableId], tag],
            };
        }
        case '@@tag/REMOVE_TAG_ITEM': {
            const { tableId, tagId } = action.payload;
            const updatedState = state[tableId].filter(
                (tag) => tag.id !== tagId
            );
            return {
                ...state,
                [tableId]: updatedState,
            };
        }
        default: {
            return state;
        }
    }
}

export default combineReducers({
    tagItemByTableId,
});
