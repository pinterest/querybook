import { ITag } from 'const/tag';
import { TableTagResource } from 'resource/table';
import { ThunkResult } from './types';

function fetchTableTagsFromTable(
    tableId: number
): ThunkResult<Promise<ITag[]>> {
    return async (dispatch) => {
        const { data } = await TableTagResource.get(tableId);
        dispatch({
            type: '@@tag/RECEIVE_TAGS_BY_TABLE',
            payload: { tableId, tags: data },
        });
        return data;
    };
}

export function fetchTableTagsFromTableIfNeeded(
    tableId: number
): ThunkResult<Promise<any>> {
    return (dispatch, getState) => {
        const state = getState();
        const tags = state.tag.tableIdToTagName[tableId];
        if (!tags) {
            return dispatch(fetchTableTagsFromTable(tableId));
        }
    };
}

export function createTableTag(
    tableId: number,
    tag: string
): ThunkResult<Promise<ITag>> {
    return async (dispatch) => {
        try {
            const { data } = await TableTagResource.create(tableId, tag);
            dispatch({
                type: '@@tag/RECEIVE_TAG_BY_TABLE',
                payload: { tableId, tag: data },
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    };
}
export function deleteTableTag(
    tableId: number,
    tagName: string
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        try {
            await TableTagResource.delete(tableId, tagName);
            dispatch({
                type: '@@tag/REMOVE_TAG_FROM_TABLE',
                payload: { tableId, tagName },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

export function updateTag(tag: ITag): ThunkResult<Promise<ITag>> {
    return async (dispatch) => {
        const { data: newTag } = await TableTagResource.update(tag);

        dispatch({
            type: '@@tag/RECEIVE_TAG',
            payload: {
                tag,
            },
        });

        return newTag;
    };
}
