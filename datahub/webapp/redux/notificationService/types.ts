import { Action } from 'redux';

export type  NotificationServiceAction =
    | IReceiveNotifiers

export interface INotificationState {
    notificationServices: []
}


export interface INotifier {
    name: string;
}

export interface IReceiveNotifiers extends Action {
    type: '@@notificationService/RECEIVE_NOTIFIERS';
    payload: {
        notificationServices: INotifier[];
    };
}