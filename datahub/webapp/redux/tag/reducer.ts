import { produce } from 'immer';

import { ITagState, TagAction } from './types';
import { combineReducers } from 'redux';

const initialState: ITagState = {
    tagItemByTableId: {},
};

function tagItemByTableId(
    state = initialState.tagItemByTableId,
    action: TagAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@tag/RECEIVE_TAG_ITEMS': {
                const { tableId, tags } = action.payload;

                draft[tableId] = tags;
                return;
            }
            case '@@tag/RECEIVE_TAG_ITEM': {
                const { tableId, tag } = action.payload;
                draft[tableId].push(tag);
                return;
            }
            case '@@tag/REMOVE_TAG_ITEM': {
                const { tableId, tagId } = action.payload;
                draft[tableId] = draft[tableId].filter(
                    (tag) => tag.id !== tagId
                );
                return;
            }
        }
    });
}

export default combineReducers({
    tagItemByTableId,
});
