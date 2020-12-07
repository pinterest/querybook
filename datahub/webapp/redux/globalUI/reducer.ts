import { produce } from 'immer';
import { IGlobalUIState, GlobalUIAction } from './types';

const initialState: IGlobalUIState = {
    notifications: [],
    announcements: [],
    dismissedAnnouncementIds: [],
    confirmation: null,
    sidebarTableId: null,
    dataDocNavigatorSectionOpen: {
        recent: true,
        favorite: true,
    },
};

export default function globalUI(state = initialState, action: GlobalUIAction) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@globalUI/PUSH_NOTIFICATION': {
                draft.notifications.push(action.payload);
                return;
            }
            case '@@globalUI/POP_NOTIFICATION': {
                const { id } = action.payload;

                draft.notifications = draft.notifications.filter(
                    (n) => n.id !== id
                );
                return;
            }
            case '@@globalUI/SET_CONFIRMATION': {
                draft.confirmation = action.payload;
                return;
            }
            case '@@globalUI/REMOVE_CONFIRMATION': {
                draft.confirmation = null;
                return;
            }
            case '@@globalUI/RECEIVE_ANNOUNCEMENTS': {
                draft.announcements = action.payload;
                return;
            }

            case '@@globalUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS': {
                draft.dismissedAnnouncementIds = action.payload;
                return;
            }
            case '@@globalUI/DISMISS_ANNOUNCEMENT_ID': {
                draft.dismissedAnnouncementIds = [
                    ...new Set(
                        draft.dismissedAnnouncementIds.concat([action.payload])
                    ),
                ];
                return;
            }
            case '@@globalUI/SET_SIDEBAR_TABLE_ID': {
                draft.sidebarTableId = action.payload;
                return;
            }
            case '@@globalUI/SET_DATA_DOC_NAV_SECTION': {
                const { section, value } = action.payload;

                draft.dataDocNavigatorSectionOpen[section] = value;
                return;
            }
            case '@@globalUI/RECEIVE_DATA_DOC_NAV_SECTION': {
                draft.dataDocNavigatorSectionOpen = {
                    ...draft.dataDocNavigatorSectionOpen,
                    ...action.payload,
                };
                return;
            }
        }
    });
}
