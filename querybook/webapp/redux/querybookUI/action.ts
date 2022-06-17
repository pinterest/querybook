import localStore from 'lib/local-store';
import {
    DATA_DOC_NAV_SECTION_KEY,
    DataDocNavSectionValue,
    DISMISSED_ANNOUNCEMENT_KEY,
    DismissedAnnouncementValue,
} from 'lib/local-store/const';
import { ISetGlobalStateAction } from 'redux/globalState/types';
import { AnnouncementResource } from 'resource/announcement';

import {
    IAnnouncement,
    IRemoveConfirmationAction,
    ISetCollapsedAction,
    ISetConfirmationAction,
    ISetSidebarTableId,
    ThunkResult,
} from './types';

export function setConfirmation(props): ISetConfirmationAction {
    return {
        type: '@@querybookUI/SET_CONFIRMATION',
        payload: props,
    };
}

export function removeConfirmation(): IRemoveConfirmationAction {
    return {
        type: '@@querybookUI/REMOVE_CONFIRMATION',
    };
}

export function loadAnnouncements(): ThunkResult<Promise<IAnnouncement[]>> {
    return async (dispatch) => {
        const { data } = await AnnouncementResource.getAll();
        dispatch({
            type: '@@querybookUI/RECEIVE_ANNOUNCEMENTS',
            payload: data,
        });

        return data;
    };
}

export function loadDismissedAnnouncements(): ThunkResult<Promise<number[]>> {
    return async (dispatch) => {
        const ids =
            (await localStore.get<DismissedAnnouncementValue>(
                DISMISSED_ANNOUNCEMENT_KEY
            )) || [];

        dispatch({
            type: '@@querybookUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS',
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
            type: '@@querybookUI/DISMISS_ANNOUNCEMENT_ID',
            payload: itemId,
        });

        await localStore.set(
            DISMISSED_ANNOUNCEMENT_KEY,
            getState().querybookUI.dismissedAnnouncementIds
        );
    };
}

export function setSidebarTableId(id: number): ISetSidebarTableId {
    return {
        type: '@@querybookUI/SET_SIDEBAR_TABLE_ID',
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

export function setDataDocNavSection(
    section: string,
    value: boolean
): ThunkResult<void> {
    return (dispatch, getState) => {
        dispatch({
            type: '@@querybookUI/SET_DATA_DOC_NAV_SECTION',
            payload: {
                section,
                value,
            },
        });

        localStore.set<DataDocNavSectionValue>(
            DATA_DOC_NAV_SECTION_KEY,
            getState().querybookUI.dataDocNavigatorSectionOpen
        );
    };
}

export function setDataDocNavBoard(boardId: number, value: boolean) {
    return setDataDocNavSection(`board-${boardId}`, value);
}

export function getDataDocNavSectionConfigFromStore(): ThunkResult<void> {
    return async (dispatch) => {
        const payload =
            (await localStore.get<DataDocNavSectionValue>(
                DATA_DOC_NAV_SECTION_KEY
            )) ?? {};
        dispatch({
            type: '@@querybookUI/RECEIVE_DATA_DOC_NAV_SECTION',
            payload,
        });
    };
}

export function setCollapsed(value: boolean): ISetCollapsedAction {
    return {
        type: '@@environment/SET_COLLAPSED',
        payload: value,
    };
}
