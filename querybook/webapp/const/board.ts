import { ContentState } from 'draft-js';
import { IDataDoc } from './datadoc';
import { IDataTable } from './metastore';

export interface IBoardRaw extends IBoard {
    docs: IDataDoc[];
    tables: IDataTable[];
    items: IBoardItem[];
}

export interface IBoardWithItemIds extends IBoard {
    docs: number[];
    tables: number[];
    items: number[];
}

export interface IBoard {
    id: number;
    created_at: number;
    updated_at: number;
    deleted_at: number;

    name: string;
    description: string;
    public: boolean;
    board_type: string;

    environment_id: number;
    owner_uid: number;
}

export interface IBoardItem {
    id: number;
    board_id: number;
    created_at: number;
    data_doc_id: number | null;
    table_id: number | null;
}

export type BoardItemType = 'table' | 'data_doc';

export enum BoardOrderBy {
    alphabetical = 0,
    createdAt,
    updatedAt,
}
export const BoardOrderToDescription = {
    [BoardOrderBy.alphabetical]: 'Alphabetical',
    [BoardOrderBy.createdAt]: 'Created At',
    [BoardOrderBy.updatedAt]: 'Last Updated',
};
export const BoardOrderToTitle = {
    [BoardOrderBy.alphabetical]: '↓Aa',
    [BoardOrderBy.createdAt]: '↑C',
    [BoardOrderBy.updatedAt]: '↑U',
};
