import { ContentState } from 'draft-js';
import { IDataDoc } from './datadoc';
import { IDataTable } from './metastore';

// Board returned from API
export interface IBoardBase {
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

export interface IBoardWithItemIds extends IBoard {
    docs: number[];
    tables: number[];
    boards: number[];
    items: number[];
}

export interface IBoard extends Omit<IBoardBase, 'description'> {
    description: ContentState;
}

export interface IBoardRaw extends IBoardBase {
    docs: IDataDoc[];
    tables: IDataTable[];
    boards: IBoardItem[];
    items: IBoardItem[];
}

export interface IBoardUpdatableField {
    public?: boolean;
    description?: string;
    name?: string;
}

export interface IBoardItemRaw {
    id: number;

    parent_board_id: number;

    created_at: number;

    data_doc_id: number | null;
    table_id: number | null;
    board_id: number | null;

    description: string;

    meta: Record<string, string>;
}

export interface IBoardItem extends Omit<IBoardItemRaw, 'description'> {
    description: ContentState;
}

export type BoardItemType = 'table' | 'data_doc' | 'board';

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
    [BoardOrderBy.alphabetical]: 'Aa',
    [BoardOrderBy.createdAt]: 'C@',
    [BoardOrderBy.updatedAt]: 'U@',
};
