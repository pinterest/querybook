import { ThunkResult } from 'redux/notificationService/types';
import ds from 'lib/datasource';
import { INotifier } from './types';

export function fetchNotifiers(): ThunkResult<Promise<INotifier[]>> {
    return async (dispatch) => {
        const { data: notificationServices } = await ds.fetch(
            '/user/notifiers/'
        );

        dispatch({
            type: '@@notificationService/RECEIVE_NOTIFIERS',
            payload: {
                notificationServices,
            },
        });
        return notificationServices;
    };
}
