import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IDataDoc } from 'const/datadoc';
import { ITaskSchedule, ITaskStatusRecord } from 'const/schedule';

import { IStoreState } from '../store/types';
import { OptionsType } from 'const/options';

interface IBasicScheduledDocFilters {
    name?: string;
    scheduled_only?: boolean;
    status?: boolean;
}

export interface IScheduledDocFilters extends IBasicScheduledDocFilters {
    recurrence?: OptionsType[];
    list_ids?: OptionsType[];
}

export interface ITransformedScheduledDocFilters
    extends IBasicScheduledDocFilters {
    recurrence?: string[];
    list_ids?: string[];
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
        filters: ITransformedScheduledDocFilters;
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
    filters: ITransformedScheduledDocFilters;
}
