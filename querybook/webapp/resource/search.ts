import ds from 'lib/datasource';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';
import type {
    IDataDocPreview,
    ISearchDataDocParams,
    ISearchTableParams,
    ISearchUserParams,
    ITablePreview,
    IUserSearchResultRow,
} from 'const/search';

export const SearchTableResource = {
    searchConcise: (params: ISearchTableParams) =>
        ds.fetch<{
            results: ITableSearchResult[];
            count: number;
        }>('/search/tables/', { ...params, concise: true }),

    search: (params: ISearchTableParams) =>
        ds.fetch<{
            results: ITablePreview[];
            count: number;
        }>('/search/tables/', { ...params, concise: false }),

    suggest: (metastoreId: number, prefix: string) =>
        ds.fetch<string[]>(`/suggest/${metastoreId}/tables/`, {
            prefix,
        }),
};

export const SearchDataDocResource = {
    search: (params: ISearchDataDocParams) =>
        ds.fetch<{
            results: IDataDocPreview[];
            count: number;
        }>('/search/datadoc/', (params as unknown) as Record<string, unknown>),
};

export const SearchUserResource = {
    search: (params: ISearchUserParams) =>
        ds.fetch<IUserSearchResultRow[]>(
            '/search/user/',
            (params as unknown) as Record<string, unknown>
        ),
};
