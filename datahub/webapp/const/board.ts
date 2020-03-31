import { IDataDoc } from './datadoc';
import { IDataTable } from './metastore';

export interface IBoardRaw extends IBoard {
    docs: IDataDoc[];
    tables: IDataTable[];
}

export interface IBoardWithItemIds extends IBoard {
    docs: number[];
    tables: number[];
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

export type BoardItemType = 'table' | 'data_doc';
