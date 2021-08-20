import { ITagItem } from 'const/tag';
import { TableTagResource } from 'resource/table';
import { ThunkResult } from './types';

function fetchTableTagItems(tableId: number): ThunkResult<Promise<ITagItem[]>> {
    return async (dispatch) => {
        const { data } = await TableTagResource.get(tableId);
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
            const { data } = await TableTagResource.create(tableId, tag);
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
            await TableTagResource.delete(tableId, tagId);
            dispatch({
                type: '@@tag/REMOVE_TAG_ITEM',
                payload: { tableId, tagId },
            });
        } catch (e) {
            console.error(e);
        }
    };
}
