import ds from 'lib/datasource';

import { ITagItem } from 'const/tag';
import { ThunkResult } from './types';

function fetchTableTagItems(tableId: number): ThunkResult<Promise<ITagItem[]>> {
    return async (dispatch) => {
        const { data } = await ds.fetch<ITagItem[]>(`/tag/table/${tableId}/`);
        dispatch({
            type: '@@tag/RECEIVE_TAG_ITEMS',
            payload: { tableId, tags: data },
        });
        return data;
    };
}

export function fetchTableTagItemsIfNeeded(
    tableId: number
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const tags = state.tag.tagItemByTableId[tableId];
        if (!tags) {
            return dispatch(fetchTableTagItems(tableId));
        }
    };
}

export function createTableTagItem(
    tableId: number,
    tag: string
): ThunkResult<Promise<ITagItem>> {
    return async (dispatch) => {
        try {
            const { data } = await ds.save(`/tag/table/${tableId}/`, { tag });
            dispatch({
                type: '@@tag/RECEIVE_TAG_ITEM',
                payload: { tableId, tag: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}
export function deleteTableTagItem(
    tableId: number,
    tagId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            await ds.delete(`/tag/table/${tableId}/${tagId}/`);
            dispatch({
                type: '@@tag/REMOVE_TAG_ITEM',
                payload: { tableId, tagId },
            });
        } catch (e) {
            console.error(e);
        }
    };
}
