import { Action } from 'redux';

export type NotificationServiceAction = IReceiveNotifiersAction;

export interface INotificationState {
    notificationServices: INotifier[];
}

export interface INotifier {
    name: string;
}

export interface IReceiveNotifiersAction extends Action {
    type: '@@notificationService/RECEIVE_NOTIFIERS';
    payload: {
        notificationServices: INotifier[];
    };
}
