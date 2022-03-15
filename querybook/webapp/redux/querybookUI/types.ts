import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import type { IStoreState } from '../store/types';
import type { IConfirmationMessageProps } from 'components/ConfirmationManager/ConfirmationMessage';
import type { GlobalStateAction } from 'redux/globalState/types';

export interface IAnnouncement {
    id: number;
    message: string;
    url_regex: string;
    can_dismiss: boolean;
}

export interface ISetConfirmationAction extends Action {
    type: '@@querybookUI/SET_CONFIRMATION';
    payload: IConfirmationMessageProps;
}

export interface IRemoveConfirmationAction extends Action {
    type: '@@querybookUI/REMOVE_CONFIRMATION';
}

export interface IReceiveAnnouncements extends Action {
    type: '@@querybookUI/RECEIVE_ANNOUNCEMENTS';
    payload: IAnnouncement[];
}

export interface IReceiveAnnouncementIds extends Action {
    type: '@@querybookUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS';
    payload: number[];
}

export interface IDismissAnnouncementId extends Action {
    type: '@@querybookUI/DISMISS_ANNOUNCEMENT_ID';
    payload: number;
}

export interface ISetSidebarTableId extends Action {
    type: '@@querybookUI/SET_SIDEBAR_TABLE_ID';
    payload: number;
}

export interface ISetDataDocNavSection extends Action {
    type: '@@querybookUI/SET_DATA_DOC_NAV_SECTION';
    payload: {
        section: string;
        value: boolean;
    };
}

export interface IReceiveDataDocNavSection extends Action {
    type: '@@querybookUI/RECEIVE_DATA_DOC_NAV_SECTION';
    payload: Record<string, boolean>;
}

export interface ISetCollapsedAction extends Action {
    type: '@@environment/SET_COLLAPSED';
    payload: boolean;
}

export type QuerybookUIAction =
    | ISetConfirmationAction
    | IRemoveConfirmationAction
    | IReceiveAnnouncements
    | IReceiveAnnouncementIds
    | IDismissAnnouncementId
    | ISetSidebarTableId
    | GlobalStateAction
    | ISetDataDocNavSection
    | IReceiveDataDocNavSection
    | ISetCollapsedAction;

export interface IQuerybookUIState {
    announcements: IAnnouncement[];
    dismissedAnnouncementIds: number[];

    confirmation?: IConfirmationMessageProps;

    sidebarTableId: number;

    dataDocNavigatorSectionOpen: Record<string, boolean>;

    isEnvCollapsed: boolean;
}

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    QuerybookUIAction
>;
