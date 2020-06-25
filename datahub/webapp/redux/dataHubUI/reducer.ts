import { produce } from 'immer';
import { IDataHubUIState, DataHubUIAction } from './types';

const initialState: IDataHubUIState = {
    notifications: [],
    announcements: [],
    dismissedAnnouncementIds: [],
    confirmation: null,
    sidebarTableId: null,
};

export default function dataHubUI(
    state = initialState,
    action: DataHubUIAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataHubUI/PUSH_NOTIFICATION': {
                draft.notifications.push(action.payload);
                return;
            }
            case '@@dataHubUI/POP_NOTIFICATION': {
                const { id } = action.payload;

                draft.notifications = draft.notifications.filter(
                    (n) => n.id !== id
                );
                return;
            }
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
        }
    });
}
