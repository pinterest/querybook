import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ICancelablePromise } from 'lib/datasource';
import { Dispatch, IStoreState } from 'redux/store/types';
import * as UserActions from 'redux/user/action';

export function useUser({ uid, name }: { uid?: number; name?: string }) {
    const userInfo = useSelector((state: IStoreState) =>
        uid
            ? state.user.userInfoById[uid]
            : state.user.userInfoById[state.user.userNameToId[name]]
    );
    const [loading, setLoading] = useState(userInfo == null);

    const dispatch = useDispatch<Dispatch>();
    const getUser = useCallback(
        (id: number) => dispatch(UserActions.getUser(id)),
        []
    );
    const getUserByName = useCallback(
        (username: string) => dispatch(UserActions.getUserByName(username)),
        []
    );

    useEffect(() => {
        let loadUserPromise: ICancelablePromise<any>;
        if (!userInfo) {
            setLoading(true);
            loadUserPromise = uid ? getUser(uid) : getUserByName(name);

            loadUserPromise.finally(() => setLoading(false));
        }

        return () => {
            if (loadUserPromise && 'cancel' in loadUserPromise) {
                loadUserPromise.cancel();
            }
        };
    }, [uid, name, userInfo]);

    return {
        loading,
        userInfo,
    };
}
