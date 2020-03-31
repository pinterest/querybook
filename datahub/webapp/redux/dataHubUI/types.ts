import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { IStoreState } from '../store/types';
import * as React from 'react';
import { IConfirmationMessageProps } from 'components/ConfirmationManager/ConfirmationMessage';

export interface IAnnouncement {
    id: number;
    message: string;
    url_regex: string;
    can_dismiss: boolean;
}

export interface INotificationInfo {
    id: string;
    content: React.ReactNode;
    timeout?: number;
    onHide?: () => any;
}

export interface IPushNotificationAction extends Action {
    type: '@@dataHubUI/PUSH_NOTIFICATION';
    payload: INotificationInfo;
}

export interface IPopNotificationAction extends Action {
    type: '@@dataHubUI/POP_NOTIFICATION';
    payload: {
        id: string;
    };
}

export interface ISetConfirmationAction extends Action {
    type: '@@dataHubUI/SET_CONFIRMATION';
    payload: IConfirmationMessageProps;
}

export interface IRemoveConfirmationAction extends Action {
    type: '@@dataHubUI/REMOVE_CONFIRMATION';
}

export interface IReceiveAnnouncements extends Action {
    type: '@@datahubUI/RECEIVE_ANNOUNCEMENTS';
    payload: IAnnouncement[];
}

export interface IReceiveAnnouncementIds extends Action {
    type: '@@datahubUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS';
    payload: number[];
}

export interface IDismissAnnouncementId extends Action {
    type: '@@datahubUI/DISMISS_ANNOUNCEMENT_ID';
    payload: number;
}

export interface ISetSidebarTableId extends Action {
    type: '@@datahubUI/SET_SIDEBAR_TABLE_ID';
    payload: number;
}

export interface ISetAppBlurred extends Action {
    type: '@@datahubUI/SET_APP_BLURRED';
    payload: boolean;
}

export type DataHubUIAction =
    | IPushNotificationAction
    | IPopNotificationAction
    | ISetConfirmationAction
    | IRemoveConfirmationAction
    | IReceiveAnnouncements
    | IReceiveAnnouncementIds
    | IDismissAnnouncementId
    | ISetSidebarTableId
    | ISetAppBlurred;

export interface IDataHubUIState {
    announcements: IAnnouncement[];
    dismissedAnnouncementIds: number[];

    notifications: INotificationInfo[];
    confirmation?: IConfirmationMessageProps;

    sidebarTableId: number;
    appBlurred: boolean;
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    DataHubUIAction
>;
