import { produce } from 'immer';
import { IQuerybookUIState, QuerybookUIAction } from './types';

const EMBED_PATH_STRING = '/_/embedded';

const initialState: IQuerybookUIState = {
    announcements: [],
    dismissedAnnouncementIds: [],
    confirmation: null,
    sidebarTableId: null,
    dataDocNavigatorSectionOpen: {
        recent: true,
        favorite: true,
    },
    isEnvCollapsed: window.location.pathname.includes(EMBED_PATH_STRING),
};

export default function querybookUI(
    state = initialState,
    action: QuerybookUIAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@querybookUI/SET_CONFIRMATION': {
                draft.confirmation = action.payload;
                return;
            }
            case '@@querybookUI/REMOVE_CONFIRMATION': {
                draft.confirmation = null;
                return;
            }
            case '@@querybookUI/RECEIVE_ANNOUNCEMENTS': {
                draft.announcements = action.payload;
                return;
            }

            case '@@querybookUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS': {
                draft.dismissedAnnouncementIds = action.payload;
                return;
            }
            case '@@querybookUI/DISMISS_ANNOUNCEMENT_ID': {
                draft.dismissedAnnouncementIds = [
                    ...new Set(
                        draft.dismissedAnnouncementIds.concat([action.payload])
                    ),
                ];
                return;
            }
            case '@@querybookUI/SET_SIDEBAR_TABLE_ID': {
                draft.sidebarTableId = action.payload;
                return;
            }
            case '@@querybookUI/SET_DATA_DOC_NAV_SECTION': {
                const { section, value } = action.payload;

                draft.dataDocNavigatorSectionOpen[section] = value;
                return;
            }
            case '@@querybookUI/RECEIVE_DATA_DOC_NAV_SECTION': {
                draft.dataDocNavigatorSectionOpen = {
                    ...draft.dataDocNavigatorSectionOpen,
                    ...action.payload,
                };
                return;
            }

            case '@@environment/SET_COLLAPSED': {
                draft.isEnvCollapsed = action.payload;
                return;
            }
        }
    });
}
