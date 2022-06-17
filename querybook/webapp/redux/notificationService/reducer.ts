import { produce } from 'immer';

import { INotificationState, NotificationServiceAction } from './types';

const initialState: INotificationState = {
    notificationServices: [],
};

export default function notifications(
    state = initialState,
    action: NotificationServiceAction
) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@notificationService/RECEIVE_NOTIFIERS': {
                draft.notificationServices =
                    action.payload.notificationServices;
            }
        }
        return;
    });
}
