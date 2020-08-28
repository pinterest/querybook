import ds from 'lib/datasource';

import { ITagItem } from 'const/tag';
import { ThunkResult } from './types';

function fetchTagItems(tableId: number): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data } = await ds.fetch<ITagItem[]>(`/tag/`, {
            table_id: tableId,
        });
        dispatch({
            type: '@@tag/RECEIVE_TAG_ITEMS',
            payload: { tableId, tags: data },
        });
        return data;
    };
}

export function fetchTagItemsIfNeeded(
    tableId: number
): ThunkResult<Promise<void>> {
    return (dispatch, getState) => {
        const state = getState();
        const tags = state.tag.tagItemByTableId[tableId];
        if (!tags) {
            return dispatch(fetchTagItems(tableId));
        }
    };
}

export function createTagItem(
    tableId: number,
    tag: string
): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        try {
            const { data } = await ds.save(`/tag/`, { table_id: tableId, tag });
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
export function deleteTagItem(
    tableId: number,
    tagId: number
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            await ds.delete(`/tag/${tagId}/`, { table_id: tableId });
            dispatch({
                type: '@@tag/REMOVE_TAG_ITEM',
                payload: { tableId, tagId },
            });
        } catch (e) {
            console.error(e);
        }
    };
}
