import { Action } from 'redux';
import { ITagItem } from 'const/tag';
import { ThunkAction } from 'redux-thunk';
import { IStoreState } from 'redux/store/types';

export interface IRecieveTagItems extends Action {
    type: '@@tag/RECEIVE_TAG_ITEMS';
    payload: {
        tableId: number;
        tags: ITagItem[];
    };
}

export interface IRecieveTagItem extends Action {
    type: '@@tag/RECEIVE_TAG_ITEM';
    payload: {
        tableId: number;
        tag: ITagItem;
    };
}
export interface IRemoveTagItem extends Action {
    type: '@@tag/REMOVE_TAG_ITEM';
    payload: {
        tableId: number;
        tagId: number;
    };
}

export type TagAction = IRecieveTagItems | IRecieveTagItem | IRemoveTagItem;

export type ThunkResult<R> = ThunkAction<R, IStoreState, undefined, TagAction>;

export interface ITagState {
    tagItemByTableId: Record<number, ITagItem[]>;
}
