import { IUserInfo } from 'const/user';
import ds from 'lib/datasource';

export function loginUser() {
    return ds.fetch<{
        uid: number;
        permission: number;
        info: IUserInfo;
    }>('/user/me/');
}

export function logoutUser() {
    return ds.fetch<null>('/logout/');
}

export function getUserByName(name: string) {
    return ds.fetch<IUserInfo>(`/user/name/${name}/`);
}

export function getUserSetting() {
    return ds.fetch<Array<{ key: string; value: string }>>(`/user/setting/`);
}

export function setUserSettings(key: string, value: string) {
    return ds.save<{
        key: string;
        value: string;
    }>(`/user/setting/${key}/`, {
        value,
    });
}
