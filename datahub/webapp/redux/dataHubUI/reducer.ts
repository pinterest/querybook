import { produce } from 'immer';
import { IDataHubUIState, DataHubUIAction } from './types';

const initialState: IDataHubUIState = {
    announcements: [],
    dismissedAnnouncementIds: [],
    confirmation: null,
    sidebarTableId: null,
    dataDocNavigatorSectionOpen: {
        recent: true,
        favorite: true,
    },
};

export default function dataHubUI(
    state = initialState,
    action: DataHubUIAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataHubUI/SET_CONFIRMATION': {
                draft.confirmation = action.payload;
                return;
            }
            case '@@dataHubUI/REMOVE_CONFIRMATION': {
                draft.confirmation = null;
                return;
            }
            case '@@datahubUI/RECEIVE_ANNOUNCEMENTS': {
                draft.announcements = action.payload;
                return;
            }

            case '@@datahubUI/RECEIVE_DISMISSED_ANNOUNCEMENT_IDS': {
                draft.dismissedAnnouncementIds = action.payload;
                return;
            }
            case '@@datahubUI/DISMISS_ANNOUNCEMENT_ID': {
                draft.dismissedAnnouncementIds = [
                    ...new Set(
                        draft.dismissedAnnouncementIds.concat([action.payload])
                    ),
                ];
                return;
            }
            case '@@datahubUI/SET_SIDEBAR_TABLE_ID': {
                draft.sidebarTableId = action.payload;
                return;
            }
            case '@@datahubUI/SET_DATA_DOC_NAV_SECTION': {
                const { section, value } = action.payload;

                draft.dataDocNavigatorSectionOpen[section] = value;
                return;
            }
            case '@@datahubUI/RECEIVE_DATA_DOC_NAV_SECTION': {
                draft.dataDocNavigatorSectionOpen = {
                    ...draft.dataDocNavigatorSectionOpen,
                    ...action.payload,
                };
                return;
            }
        }
    });
}
