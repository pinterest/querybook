import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { ITag } from 'const/tag';
import { IStoreState } from 'redux/store/types';

export interface IRecieveTagsByTable extends Action {
    type: '@@tag/RECEIVE_TAGS_BY_TABLE';
    payload: {
        tableId: number;
        tags: ITag[];
    };
}

export interface IRecieveTagByTable extends Action {
    type: '@@tag/RECEIVE_TAG_BY_TABLE';
    payload: {
        tableId: number;
        tag: ITag;
    };
}

export interface IRecieveTag extends Action {
    type: '@@tag/RECEIVE_TAG';
    payload: {
        tag: ITag;
    };
}

export interface IRemoveTagFromTable extends Action {
    type: '@@tag/REMOVE_TAG_FROM_TABLE';
    payload: {
        tableId: number;
        tagName: string;
    };
}

export type TagAction =
    | IRecieveTagsByTable
    | IRecieveTagByTable
    | IRemoveTagFromTable
    | IRecieveTag;

export type ThunkResult<R> = ThunkAction<R, IStoreState, undefined, TagAction>;

export interface ITagState {
    tableIdToTagName: Record<number, string[]>;
    tagByName: Record<string, ITag>;
}
