import { ThunkResult } from 'redux/notificationService/types';
import { UserResource } from 'resource/user';

import { INotifier } from './types';

export function fetchNotifiers(): ThunkResult<Promise<INotifier[]>> {
    return async (dispatch) => {
        const { data: notificationServices } =
            await UserResource.getNotifiers();

        dispatch({
            type: '@@notificationService/RECEIVE_NOTIFIERS',
            payload: {
                notificationServices,
            },
        });
        return notificationServices;
    };
}
