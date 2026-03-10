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

export interface IReceiveTagsByDataDoc extends Action {
    type: '@@tag/RECEIVE_TAGS_BY_DATADOC';
    payload: {
        datadocId: number;
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

export interface IReceiveTagByDataDoc extends Action {
    type: '@@tag/RECEIVE_TAG_BY_DATADOC';
    payload: {
        datadocId: number;
        tag: ITag;
    };
}

export interface IRecieveTag extends Action {
    type: '@@tag/RECEIVE_TAG';
    payload: {
        tag: ITag;
    };
}

export interface IReceiveDataDocTag extends Action {
    type: '@@tag/RECEIVE_DATADOC_TAG';
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

export interface IRemoveTagFromDataDoc extends Action {
    type: '@@tag/REMOVE_TAG_FROM_DATADOC';
    payload: {
        datadocId: number;
        tagName: string;
    };
}

export type TagAction =
    | IRecieveTagsByTable
    | IReceiveTagsByDataDoc
    | IRecieveTagByTable
    | IReceiveTagByDataDoc
    | IRemoveTagFromTable
    | IRemoveTagFromDataDoc
    | IRecieveTag
    | IReceiveDataDocTag;

export type ThunkResult<R> = ThunkAction<R, IStoreState, undefined, TagAction>;

export interface ITagState {
    tableIdToTagName: Record<number, string[]>;
    datadocIdToTagName: Record<number, string[]>;
    tagByName: Record<string, ITag>;
    datadocTagByName: Record<string, ITag>;
}
