import { produce } from 'immer';

import { ITagState, TagAction } from './types';

const initialState: ITagState = {
    tableIdToTagName: {},
    datadocIdToTagName: {},
    tagByName: {},
    datadocTagByName: {},
};

function tagReducer(state = initialState, action: TagAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@tag/RECEIVE_TAGS_BY_TABLE': {
                const { tableId, tags } = action.payload;

                draft.tableIdToTagName[tableId] = tags.map((t) => t.name);
                for (const tag of tags) {
                    draft.tagByName[tag.name] = tag;
                }
                return;
            }
            case '@@tag/RECEIVE_TAGS_BY_DATADOC': {
                const { datadocId, tags } = action.payload;

                draft.datadocIdToTagName[datadocId] = tags.map((t) => t.name);
                for (const tag of tags) {
                    draft.datadocTagByName[tag.name] = tag;
                }
                return;
            }
            case '@@tag/RECEIVE_TAG': {
                const { tag } = action.payload;
                draft.tagByName[tag.name] = tag;
                return;
            }
            case '@@tag/RECEIVE_DATADOC_TAG': {
                const { tag } = action.payload;
                draft.datadocTagByName[tag.name] = tag;
                return;
            }
            case '@@tag/RECEIVE_TAG_BY_TABLE': {
                const { tableId, tag } = action.payload;
                draft.tableIdToTagName[tableId].push(tag.name);
                draft.tagByName[tag.name] = tag;
                return;
            }
            case '@@tag/RECEIVE_TAG_BY_DATADOC': {
                const { datadocId, tag } = action.payload;
                draft.datadocIdToTagName[datadocId].push(tag.name);
                draft.datadocTagByName[tag.name] = tag;
                return;
            }
            case '@@tag/REMOVE_TAG_FROM_TABLE': {
                const { tableId, tagName } = action.payload;

                draft.tableIdToTagName[tableId] = draft.tableIdToTagName[
                    tableId
                ].filter((tName) => tName !== tagName);
                return;
            }
            case '@@tag/REMOVE_TAG_FROM_DATADOC': {
                const { datadocId, tagName } = action.payload;

                draft.datadocIdToTagName[datadocId] = draft.datadocIdToTagName[
                    datadocId
                ].filter((tName) => tName !== tagName);
                return;
            }
        }
    });
}

export default tagReducer;
