import ds from 'lib/datasource';
import {
    IQueryForm,
    IQuerySnippet,
    IQuerySnippetSearchFilter,
} from 'redux/querySnippets/types';

export const QuerySnippetResource = {
    get: (id: number) => ds.fetch<IQuerySnippet>(`/query_snippet/${id}/`),
    search: (envId: number, searchParams: IQuerySnippetSearchFilter) =>
        ds.fetch<IQuerySnippet[]>(`/query_snippet_search/`, {
            environment_id: envId,
            ...searchParams,
        }),
    update: (id: number, params: Partial<Omit<IQueryForm, 'id'>>) =>
        ds.update<IQuerySnippet>(`/query_snippet/${id}/`, params),

    create: (params: IQueryForm) =>
        ds.save<IQuerySnippet>(
            '/query_snippet/',
            params as unknown as Record<string, unknown>
        ),
    delete: (id: number) => ds.delete(`/query_snippet/${id}/`),
};
