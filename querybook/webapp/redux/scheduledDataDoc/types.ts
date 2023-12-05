import { Action } from 'redux';
import {
    ThunkAction,
    ThunkDispatch as UntypedThunkDispatch,
} from 'redux-thunk';

import { IDataDoc } from 'const/datadoc';
import { ITaskSchedule, ITaskStatusRecord } from 'const/schedule';

import { IStoreState } from '../store/types';
import { IOption } from 'lib/utils/react-select';
import { StatusType } from 'const/schedFiltersType';

interface IBasicScheduledDocFilters {
    name?: string;
    scheduled_only?: boolean;
}

export interface IScheduledDocFilters extends IBasicScheduledDocFilters {
    status?: StatusType;
    board_ids?: Array<IOption<number>>;
}

export interface ITransformedScheduledDocFilters
    extends IBasicScheduledDocFilters {
    board_ids?: number[];
    status?: boolean;
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
