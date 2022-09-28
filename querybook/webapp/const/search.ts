export interface IDataDocPreview {
    id: number;
    created_at: number;
    title: string;
    owner_uid: number;
    highlight?: {
        cells?: string[];
    };
}

export interface ISearchDataDocParams {
    environment_id: number;
    keywords: string;
    filters?: Array<[filterName: string, filterValue: any]>;
    fields?: string[];
    sort_key?: string | string[];
    sort_order?: 'desc' | 'asc';
    limit?: number;
    offset?: number;
}

export interface ITablePreview {
    id: number;
    schema: string;
    name: string;
    created_at: number;
    description: string;
    golden: boolean;
    highlight?: {
        columns?: string[];
        description?: string[];
    };
    tags: string[];
}

export interface ISearchTableParams {
    metastore_id: number;
    keywords: string;
    filters?: Array<[filterName: string, filterValue: any]>;
    fields?: string[];
    sort_key?: string | string[];
    sort_order?: 'desc' | 'asc' | Array<'desc' | 'asc'>;
    limit?: number;
    offset?: number;
}

interface IQueryPreviewBase {
    id: number;
    title: string | null;
    created_at: number;
    author_uid: number;
    engine_id: number;
    statement_type: string | string[];
    full_table_name: string | string[];
    query_text: string;
    highlight?: {
        query_text?: string[];
        title?: string[];
    };
}

interface IQueryCellPreview extends IQueryPreviewBase {
    query_type: 'query_cell';
    data_doc_id: number;
}

interface IQueryExecutionPreview extends IQueryPreviewBase {
    query_type: 'query_execution';
    duration: number;
}

export type IQueryPreview = IQueryCellPreview | IQueryExecutionPreview;

export type ISearchBoardParams = ISearchDataDocParams;
export interface IBoardPreview {
    id: number;
    title: string;
    owner_uid: number;
    description: string;
    highlight?: {
        description?: string[];
    };
}

export interface ISearchQueryParams {
    environment_id: number;
    keywords: string;
    filters?: Array<[filterName: string, filterValue: any]>;
    sort_key?: string | string[];
    sort_order?: 'desc' | 'asc';
    limit?: number;
    offset?: number;
}

export type ISearchPreview =
    | IQueryPreview
    | IDataDocPreview
    | ITablePreview
    | IBoardPreview;

export interface IUserSearchResultRow {
    id: number;
    username: string;
    fullname: string;
}

export interface ISearchUserParams {
    name: string;
    limit?: number;
    offset?: number;
}
