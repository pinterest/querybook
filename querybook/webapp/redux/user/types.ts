import { IMyUserInfo, IUserInfo } from 'const/user';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { IStoreState } from '../store/types';

export interface IUserSettingState {
    rawSettings: Record<string, string>;
    computedSettings: Record<string, string>;
    fromWeb: boolean;
}

export interface IUserState extends IUserSettingState {
    userInfoById: Record<number, IUserInfo>;
    myUserInfo?: IMyUserInfo;
    userNameToId: Record<string, number>;
}

export interface ILoginUserAction extends Action {
    type: '@@user/LOGIN_USER';
    payload: {
        userInfo: IUserInfo;
        myUserInfo: IMyUserInfo;
    };
}

export interface IReceiveUserAction extends Action {
    type: '@@user/RECEIVE_USER';
    payload: IUserInfo;
}

export interface IReceiveUserSettingAction extends Action {
    type: '@@user/RECEIVE_USER_SETTING';
    payload: {
        userSetting: Record<string, string>;
        fromLocal?: boolean;
        environmentId: number;
    };
}

export interface IReceiveUserKeySettingAction extends Action {
    type: '@@user/RECEIVE_USER_KEY_SETTING';
    payload: {
        key: string;
        value: string;
        environmentId: number;
    };
}

export type UserAction =
    | IReceiveUserAction
    | ILoginUserAction
    | IReceiveUserSettingAction
    | IReceiveUserKeySettingAction;

export type ThunkResult<R> = ThunkAction<R, IStoreState, undefined, UserAction>;
