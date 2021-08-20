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
}

export interface ISearchTableParams {
    metastore_id: number;
    keywords: string;
    filters?: Array<[filterName: string, filterValue: any]>;
    fields?: string[];
    sort_key?: string | string[];
    sort_order?: 'desc' | 'asc';
    limit?: number;
    offset?: number;
}

export type ISearchPreview = IDataDocPreview | ITablePreview;

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
