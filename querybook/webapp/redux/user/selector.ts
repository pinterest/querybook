import { createSelector } from 'reselect';
import { IStoreState } from 'redux/store/types';

const userInfoByIdSelector = (state: IStoreState) => state.user.userInfoById;
const myUidSelector = (state: IStoreState) => state.user.myUserInfo.uid;

export const myUserInfoSelector = createSelector(
    userInfoByIdSelector,
    myUidSelector,
    (userInfoById, uid) => userInfoById[uid]
);
