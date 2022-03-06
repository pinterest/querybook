import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IDataDoc } from 'const/datadoc';
import { IStoreState } from '../store/types';
import { ITaskStatusRecord, ITaskSchedule } from 'const/schedule';

export type IScheduledDoc = {
    doc: IDataDoc;
    lastRecord: ITaskStatusRecord;
    schedule: ITaskSchedule;
};

export interface IReceiveDataWithSchemaAction extends Action {
    type: '@@dataDoc/RECEIVE_DATA_WITH_SCHEMA';
    payload: {
        docs: IScheduledDoc[];
        total: number;
        page: number;
        pageSize: number;
        filtered: string;
    };
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    IReceiveDataWithSchemaAction
>;

export type ThunkDispatch = UntypedThunkDispatch<
    IStoreState,
    undefined,
    IReceiveDataWithSchemaAction
>;

export interface IScheduledDataDocState {
    docs: IScheduledDoc[];
    totalPages: number;
    page: number;
    pageSize: number;
    filtered: string;
}
