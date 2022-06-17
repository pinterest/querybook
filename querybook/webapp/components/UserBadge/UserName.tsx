import React from 'react';

import { IUserInfo } from 'const/user';
import { useUser } from 'hooks/redux/useUser';
import { titleize } from 'lib/utils';

import { ICommonUserLoaderProps } from './types';

export interface IUserNameComponentProps {
    loading: boolean;
    userInfo: IUserInfo;
}

export const UserNameComponent: React.FunctionComponent<
    IUserNameComponentProps
> = ({ loading, userInfo }) => {
    const fullName = loading
        ? 'loading...'
        : userInfo
        ? titleize(userInfo.fullname) || userInfo.username
        : '[No Name]';

    return <span>{fullName}</span>;
};

export const UserName: React.FunctionComponent<ICommonUserLoaderProps> = ({
    uid,
    name,
}) => {
    const { loading, userInfo } = useUser({ uid, name });

    return <UserNameComponent loading={loading} userInfo={userInfo} />;
};
