import ds from 'lib/datasource';
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
    return async (dispatch, getState) => {
        const { data } = await ds.fetch(`/query_snippet/${id}/`);
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
        const { data } = await ds.fetch(`/query_snippet_search/`, {
            environment_id: environmentId,
            ...searchParams,
        });
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

        const params = {
            context,
            title,
            description,
            engine_id: engineId,
            is_public: isPublic,
            golden,
        };

        const { data } = await ds.update(`/query_snippet/${id}/`, params);
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
        const params = querySnippet;
        const { data } = await ds.save(
            '/query_snippet/',
            (params as unknown) as Record<string, unknown>
        );
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
    return async (dispatch, getState) => {
        const { id } = querySnippet;

        await ds.delete(`/query_snippet/${id}/`);

        dispatch({
            type: '@@querySnippets/REMOVE_QUERY_SNIPPET',
            payload: {
                querySnippet,
            },
        });
    };
}
