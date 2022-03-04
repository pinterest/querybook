import { IUserInfo } from 'const/user';
import ds from 'lib/datasource';
import { IEnvironment } from 'redux/environment/types';
import { INotifier } from 'redux/notificationService/types';

export const UserResource = {
    login: (username: string, password: string) =>
        ds.save<IUserInfo>('/login/', {
            username,
            password,
        }),
    signup: (username: string, password: string, email: string) =>
        ds.save<IUserInfo>('/signup/', {
            username,
            password,
            email,
        }),
    logout: () => ds.fetch<null>('/logout/'),

    getMyInfo: () =>
        ds.fetch<{
            uid: number;
            permission: number;
            info: IUserInfo;
        }>('/user/me/'),
    getUserByName: (name: string) => ds.fetch<IUserInfo>(`/user/name/${name}/`),
    getLoginMethods: () =>
        ds.fetch<{
            has_login: boolean;
            has_signup: boolean;
            oauth_url: string;
        }>('/user/login_method/'),
    getEnvironments: () =>
        ds.fetch<
            [visibleEnvironments: IEnvironment[], userEnvironmentIds: number[]]
        >('/user/environment/'),
    getNotifiers: () => ds.fetch<INotifier[]>('/user/notifiers/'),
};

export const UserSettingResource = {
    getAll: () =>
        ds.fetch<Array<{ key: string; value: string }>>(`/user/setting/`),
    set: (key: string, value: string) =>
        ds.save<{
            key: string;
            value: string;
        }>(`/user/setting/${key}/`, {
            value,
        }),
};
