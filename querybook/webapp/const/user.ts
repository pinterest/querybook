// Keep it the same as const/user_roles.py
export enum UserRoleType {
    ADMIN = 0,
}

export interface IUserInfo {
    id: number;
    username: string;
    fullname: string;
    profile_img: string;
    deleted: boolean;

    roles?: number[];
}

export interface IMyUserInfo {
    uid: number;
    permission?: number;
    isAdmin: boolean;
}

export const DELETED_USER_MSG = '(deactivated)';
