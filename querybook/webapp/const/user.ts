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
    email: string;
    is_group: boolean;

    roles?: number[];

    properties: {
        description?: string;
    };
}

export interface IMyUserInfo {
    uid: number;
    permission?: number;
    isAdmin: boolean;
}

export const DELETED_USER_MSG = '(deactivated)';
