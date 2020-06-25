import { uniqueId } from 'lodash';

import {
    ThunkResult,
    INotificationInfo,
    ISetConfirmationAction,
    IRemoveConfirmationAction,
    IAnnouncement,
    ISetSidebarTableId,
} from './types';

import localStore from 'lib/local-store';
import {
    DISMISSED_ANNOUNCEMENT_KEY,
    DismissedAnnouncementValue,
} from 'lib/local-store/const';
import ds from 'lib/datasource';
import { ISetGlobalStateAction } from 'redux/globalState/types';

export function pushNotification({
    content,
    timeout,
    onHide,
}: Omit<INotificationInfo, 'id'>): ThunkResult<string> {
    return (dispatch, state) => {
        const id = uniqueId('notification');
        dispatch({
            type: '@@dataHubUI/PUSH_NOTIFICATION',
            payload: {
                id,
                content,
                timeout,
                onHide,
            },
        });

        return id;
    };
}

export function popNotification(id: string): ThunkResult<void> {
    return (dispatch, getState) => {
        const notification = getState().dataHubUI.notifications.find(
            (n) => n.id === id
        );
        if (notification && notification.onHide) {
            notification.onHide();
        }

        dispatch({
            type: '@@dataHubUI/POP_NOTIFICATION',
            payload: {
                id,
            },
        });
    };
}

export function setConfirmation(props): ISetConfirmationAction {
    return {
        type: '@@dataHubUI/SET_CONFIRMATION',
        payload: props,
    };
}

export function removeConfirmation(): IRemoveConfirmationAction {
    return {
        type: '@@dataHubUI/REMOVE_CONFIRMATION',
    };
}

export function loadAnnouncements(): ThunkResult<Promise<IAnnouncement[]>> {
    return async (dispatch, state) => {
        const { data } = await ds.fetch('/announcement/');
        dispatch({
            type: '@@datahubUI/RECEIVE_ANNOUNCEMENTS',
            payload: data,
        });

        return data;
    };
}

export function loadDismissedAnnouncements(): ThunkResult<Promise<number[]>> {
    return async (dispatch, getState) => {
        const ids =
            (await localStore.get<DismissedAnnouncementValue>(
                DISMISSED_ANNOUNCEMENT_KEY
            )) || [];

        dispatch({
            type: '@@datahubUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS',
            payload: ids,
        });

        return ids;
    };
}

export function dismissAnnouncement(
    itemId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        dispatch({
            type: '@@datahubUI/DISMISS_ANNOUNCEMENT_ID',
            payload: itemId,
        });

        await localStore.set(
            DISMISSED_ANNOUNCEMENT_KEY,
            getState().dataHubUI.dismissedAnnouncementIds
        );
    };
}

export function setSidebarTableId(id: number): ISetSidebarTableId {
    return {
        type: '@@datahubUI/SET_SIDEBAR_TABLE_ID',
        payload: id,
    };
}

export function setAppBlurred(blur: boolean): ISetGlobalStateAction {
    return {
        type: '@@globalState/SET_GLOBAL_STATE',
        payload: {
            key: 'appBlurred',
            value: blur,
        },
    };
}

export function setSessionExpired(): ThunkResult<void> {
    return (dispatch, getState) => {
        // Can't expire the session if user is not logged in
        if (!!getState().user.myUserInfo) {
            dispatch({
                type: '@@globalState/SET_GLOBAL_STATE',
                payload: {
                    key: 'sessionExpired',
                    value: true,
                },
            });
        }
    };
}
