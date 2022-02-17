import React, { useMemo } from 'react';

import { useUser } from 'hooks/redux/useUser';
import { ICommonUserLoaderProps } from './types';

import { UserNameComponent } from './UserName';
import { UserAvatarComponent } from './UserAvatar';

import './UserBadge.scss';

type IProps = {
    isOnline?: boolean;
    mini?: boolean;
} & ICommonUserLoaderProps;

export const UserBadge: React.FunctionComponent<IProps> = ({
    uid,
    name,
    isOnline,
    mini,
}) => {
    const { loading, userInfo } = useUser({ uid, name });

    const avatarDOM = (
        <UserAvatarComponent
            userInfo={userInfo}
            loading={loading}
            isOnline={isOnline}
        />
    );

    const userName = useMemo(
        () =>
            userInfo
                ? userInfo.username
                : name
                ? `Unknown (${name})`
                : 'Unknown',
        [userInfo?.username, name]
    );

    if (mini) {
        return (
            <span className="UserBadge mini">
                <figure>{avatarDOM}</figure>
                <span className="user-name">
                    {userInfo?.fullname ?? userName}
                </span>
            </span>
        );
    }

    return (
        <div className="UserBadge flex-row">
            <div className="UserBadge-icon">
                <figure>{avatarDOM}</figure>
            </div>
            <div className="UserBadge-names">
                <div className="username one-line-ellipsis">
                    <UserNameComponent userInfo={userInfo} loading={loading} />
                </div>
                <div className="handle">@{userName}</div>
            </div>
        </div>
    );
};
