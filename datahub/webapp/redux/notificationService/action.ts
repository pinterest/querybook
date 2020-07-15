import { ThunkResult } from 'redux/user/types';
import ds from 'lib/datasource';

export function fetchNotifiers(): ThunkResult<Promise<any>> {
    return async (dispatch) => {
        const { data: notificationServices } = await ds.fetch(
            '/query_execution_notifier/'
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
