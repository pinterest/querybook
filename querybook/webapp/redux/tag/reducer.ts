import { produce } from 'immer';

import { ITagState, TagAction } from './types';
import { combineReducers } from 'redux';

const initialState: ITagState = {
    tagByTableId: {},
};

function tagByTableId(state = initialState.tagByTableId, action: TagAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@tag/RECEIVE_TAGS_BY_TABLE': {
                const { tableId, tags } = action.payload;

                draft[tableId] = tags;
                return;
            }
            case '@@tag/RECEIVE_TAG_BY_TABLE': {
                const { tableId, tag } = action.payload;
                draft[tableId].push(tag);
                return;
            }
            case '@@tag/REMOVE_TAG_FROM_TABLE': {
                const { tableId, tagName } = action.payload;
                draft[tableId] = draft[tableId].filter(
                    (tag) => tag.name !== tagName
                );
                return;
            }
        }
    });
}

export default combineReducers({
    tagByTableId,
});
