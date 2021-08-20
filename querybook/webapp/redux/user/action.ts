import localStore from 'lib/local-store';
import { USER_SETTINGS_KEY, UserSettingsValue } from 'lib/local-store/const';
import { userLoadManager } from 'lib/batch/user-load-manager';
import { UserRoleType } from 'const/user';
import { UserResource, UserSettingResource } from 'resource/user';
import { ThunkResult } from './types';

export function loginUser(): ThunkResult<Promise<void>> {
    return (dispatch) =>
        UserResource.getMyInfo().then(({ data }) => {
            if (data) {
                const { uid, permission, info } = data;

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
    return (dispatch) => userLoadManager.loadUser(uid, dispatch);
}

export function getUserByName(name: string): ThunkResult<Promise<void>> {
    return async (dispatch) => {
        const { data } = await UserResource.getUserByName(name);
        dispatch({
            type: '@@user/RECEIVE_USER',
            payload: data,
        });
    };
}

export function getUserSetting(): ThunkResult<Promise<any>> {
    return (dispatch, getState) =>
        UserSettingResource.getAll().then(({ data }) => {
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

export function setUserSettings(
    key: string,
    value: string
): ThunkResult<Promise<any>> {
    return async (dispatch, getState) => {
        const settings = getState().user.rawSettings;
        if (settings[key] === value) {
            return;
        }
        const { data } = await UserSettingResource.set(key, value);
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
