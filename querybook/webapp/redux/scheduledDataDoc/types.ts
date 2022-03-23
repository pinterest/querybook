import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IDataDoc } from 'const/datadoc';
import { IStoreState } from '../store/types';
import { ITaskStatusRecord, ITaskSchedule } from 'const/schedule';

export interface IScheduledDocFilters {
    name?: string;
    scheduled_only?: boolean;
}
export interface IScheduledDoc {
    doc: IDataDoc;
    last_record?: ITaskStatusRecord;
    schedule?: ITaskSchedule;
}

export interface IReceiveDocWithScheduleAction extends Action {
    type: '@@scheduledDataDoc/RECEIVE_DOC_WITH_SCHEMA';
    payload: {
        docs: IScheduledDoc[];
        total: number;
        page: number;
        pageSize: number;
        filters: IScheduledDocFilters;
    };
}

export type ScheduledDataDocAction = IReceiveDocWithScheduleAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    IReceiveDocWithScheduleAction
>;

export type ThunkDispatch = UntypedThunkDispatch<
    IStoreState,
    undefined,
    IReceiveDocWithScheduleAction
>;

export interface IScheduledDataDocState {
    docs: IScheduledDoc[];
    numberOfResults: number;
    page: number;
    pageSize: number;
    filters: IScheduledDocFilters;
}
