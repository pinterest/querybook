import { createSelector } from 'reselect';

import { IStoreState } from 'redux/store/types';

const tableTagNameSelector = (state: IStoreState, tableId: number) =>
    state.tag.tableIdToTagName[tableId] || [];
const tagByNameSelector = (state: IStoreState) => state.tag.tagByName;

export const tagsInTableSelector = createSelector(
    tableTagNameSelector,
    tagByNameSelector,
    (tagNames, tagByName) => tagNames.map((name) => tagByName[name])
);
