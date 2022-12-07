import { IDataTableSearchPaginationState } from './types';

export const defaultSortSchemaBy: IDataTableSearchPaginationState['schemas']['sortSchemasBy'] =
    {
        asc: true,
        key: 'name',
    };

type SchemaSortByIds =
    IDataTableSearchPaginationState['schemas']['schemaSortByIds'];

export const defaultSortSchemaTableBy: SchemaSortByIds[keyof SchemaSortByIds] =
    {
        asc: true,
        key: 'name',
    };

export const defaultSortSearchTableBy: SchemaSortByIds[keyof SchemaSortByIds] =
    {
        key: 'relevance',
        asc: true,
    };
