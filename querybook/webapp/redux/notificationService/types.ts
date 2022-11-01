import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { IStoreState } from '../store/types';

export type NotificationServiceAction = IReceiveNotifiersAction;

export interface INotificationState {
    notificationServices: INotifier[];
}

export interface INotifier {
    name: string;
    help: string;
}

export interface IReceiveNotifiersAction extends Action {
    type: '@@notificationService/RECEIVE_NOTIFIERS';
    payload: {
        notificationServices: INotifier[];
    };
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    NotificationServiceAction
>;
