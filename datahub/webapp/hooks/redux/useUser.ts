import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { ICancelablePromise } from 'lib/datasource';
import { IStoreState, Dispatch } from 'redux/store/types';
import * as UserActions from 'redux/user/action';

export function useUser(uid: number) {
    const userInfo = useSelector(
        (state: IStoreState) => state.user.userInfoById[uid]
    );
    const [loading, setLoading] = useState(userInfo == null);

    const dispatch = useDispatch<Dispatch>();
    const getUser = useCallback(
        (id: number) => dispatch(UserActions.getUser(id)),
        []
    );

    useEffect(() => {
        let loadUserPromise: ICancelablePromise<any>;
        if (userInfo == null || userInfo.id !== uid) {
            setLoading(true);
            loadUserPromise = getUser(uid).then(() => setLoading(false));
        }

        return () => {
            if (loadUserPromise && 'cancel' in loadUserPromise) {
                loadUserPromise.cancel();
            }
        };
    }, [uid, userInfo]);

    return {
        loading,
        userInfo,
    };
}
