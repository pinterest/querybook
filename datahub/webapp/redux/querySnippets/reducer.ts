import { produce } from 'immer';
import { IQuerySnippetsState, QuerySnippetsAction } from './types';

const initialState: IQuerySnippetsState = {
    querySnippetById: {},

    // for search results
    querySnippetIds: [],
};

export default function (state = initialState, action: QuerySnippetsAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@querySnippets/RECEIVE_QUERY_SNIPPET': {
                const { querySnippet } = action.payload;
                draft.querySnippetById[querySnippet.id] = querySnippet;
                return;
            }
            case '@@querySnippets/RECEIVE_QUERY_SNIPPETS': {
                const { querySnippets } = action.payload;
                (querySnippets || []).reduce((snippetsById, querySnippet) => {
                    const { id } = querySnippet;
                    snippetsById[id] = {
                        ...snippetsById[id],
                        ...querySnippet,
                    };
                    return snippetsById;
                }, draft.querySnippetById);
                draft.querySnippetIds = (querySnippets || []).map(
                    (snippet) => snippet.id
                );
                return;
            }
            case '@@querySnippets/REMOVE_QUERY_SNIPPET': {
                const {
                    querySnippet: { id },
                } = action.payload;

                delete draft.querySnippetById[id];
                draft.querySnippetIds = draft.querySnippetIds.filter(
                    (snippetId) => snippetId !== id
                );
                return;
            }
        }
    });
}
