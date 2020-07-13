import localStore from 'lib/local-store';
import { USER_SETTINGS_KEY, UserSettingsValue } from 'lib/local-store/const';
import { userLoadManager } from 'lib/batch/user-load-manager';
import ds from 'lib/datasource';

import { UserRoleType } from 'const/userRoles';
import { IUserInfo, ThunkResult } from './types';

export function logoutUser(): ThunkResult<Promise<any>> {
    return (dispatch) =>
        ds.fetch('/logout/').then(() =>
            dispatch({
                type: '@@user/LOGOUT_USER',
            })
        );
}

export function loginUser(): ThunkResult<Promise<void>> {
    return (dispatch) =>
        ds.fetch('/user/me/').then(({ data }) => {
            if (data) {
                const {
                    uid,
                    permission,
                    info,
                }: {
                    uid: number;
                    permission: number;
                    info: IUserInfo;
                } = data;

                const isAdmin = UserRoleType.ADMIN in (info.roles || []);

                dispatch({
                    type: '@@user/LOGIN_USER',
                    payload: {
                        userInfo: info,
                        myUserInfo: {
                            uid,
                            permission,
                            isAdmin,
                        },
                    },
                });

                dispatch(getUserSetting());
            }
        });
}

export function getUser(uid: number): ThunkResult<Promise<void>> {
    return (dispatch) => {
        return userLoadManager.loadUser(uid, dispatch);
    };
}

export function getUserSetting(): ThunkResult<Promise<any>> {
    return (dispatch, getState) =>
        ds
            .fetch(`/user/${getState().user.myUserInfo.uid}/setting/`)
            .then(({ data }) => {
                if (data) {
                    const userSetting = data.reduce((hash, val) => {
                        hash[val.key] = val.value;
                        return hash;
                    }, {});

                    dispatch({
                        type: '@@user/RECEIVE_USER_SETTING',
                        payload: {
                            userSetting,
                            environmentId: getState().environment
                                .currentEnvironmentId,
                        },
                    });
                }
            });
}

export function getUserSettingLocal(): ThunkResult<void> {
    return (dispatch, getState) => {
        localStore
            .get<UserSettingsValue>(USER_SETTINGS_KEY)
            .then((userSetting) => {
                if (userSetting == null) {
                    userSetting = {};
                }

                dispatch({
                    type: '@@user/RECEIVE_USER_SETTING',
                    payload: {
                        userSetting,
                        fromLocal: true,
                        environmentId: getState().environment
                            .currentEnvironmentId,
                    },
                });
            });
    };
}

export function setUserSettings(key, value): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const uid = getState().user.myUserInfo.uid;
        const settings = getState().user.rawSettings;
        if (settings[key] === value) {
            return;
        }

        const { data } = await ds.save(`/user/${uid}/setting/${key}/`, {
            value,
        });

        dispatch({
            type: '@@user/RECEIVE_USER_KEY_SETTING',
            payload: {
                key: data.key,
                value: data.value,
                environmentId: getState().environment.currentEnvironmentId,
            },
        });
    };
}
