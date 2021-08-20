import { QuerySnippetResource } from 'resource/querySnippet';
import {
    ThunkResult,
    IQueryForm,
    IQuerySnippet,
    IQuerySnippetSearchFilter,
} from './types';

export function fetchQuerySnippetIfNeeded(
    id: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const state = getState();
        const querySnippet = state.querySnippets.querySnippetById[id];
        if (!querySnippet || !querySnippet.context) {
            return dispatch(fetchQuerySnippet(id));
        }
    };
}

function fetchQuerySnippet(id: number): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data } = await QuerySnippetResource.get(id);
        dispatch({
            type: '@@querySnippets/RECEIVE_QUERY_SNIPPET',
            payload: {
                querySnippet: data,
            },
        });
    };
}

export function searchQuerySnippets(
    searchParams: IQuerySnippetSearchFilter
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const environmentId = getState().environment.currentEnvironmentId;
        const { data } = await QuerySnippetResource.search(
            environmentId,
            searchParams
        );
        dispatch({
            type: '@@querySnippets/RECEIVE_QUERY_SNIPPETS',
            payload: {
                querySnippets: data,
            },
        });
    };
}

export function updateQuerySnippet(
    querySnippet: IQueryForm
): ThunkResult<Promise<IQuerySnippet>> {
    return async (dispatch) => {
        const {
            id,
            context,
            title,
            description,
            engine_id: engineId,
            is_public: isPublic,
            golden,
        } = querySnippet;

        const { data } = await QuerySnippetResource.update(id, {
            context,
            title,
            description,
            engine_id: engineId,
            is_public: isPublic,
            golden,
        });
        dispatch({
            type: '@@querySnippets/RECEIVE_QUERY_SNIPPET',
            payload: {
                querySnippet: data,
            },
        });

        return data;
    };
}

export function saveQuerySnippet(
    querySnippet: IQueryForm
): ThunkResult<Promise<IQuerySnippet>> {
    return async (dispatch) => {
        const { data } = await QuerySnippetResource.create(querySnippet);
        dispatch({
            type: '@@querySnippets/RECEIVE_QUERY_SNIPPET',
            payload: {
                querySnippet: data,
            },
        });

        return data;
    };
}

export function deleteQuerySnippet(
    querySnippet: IQuerySnippet
): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        await QuerySnippetResource.delete(querySnippet.id);

        dispatch({
            type: '@@querySnippets/REMOVE_QUERY_SNIPPET',
            payload: {
                querySnippet,
            },
        });
    };
}
