import React, { useMemo } from 'react';

import { useUser } from 'hooks/redux/useUser';
import { ICommonUserLoaderProps } from './types';

import { UserNameComponent } from './UserName';
import { UserAvatarComponent } from './UserAvatar';

import './UserBadge.scss';

type IProps = {
    isOnline?: boolean;
    mini?: boolean;
    styled?: boolean;
} & ICommonUserLoaderProps;

export const UserBadge: React.FunctionComponent<IProps> = ({
    uid,
    name,
    isOnline,
    mini,
    styled,
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
        [userInfo, name]
    );

    if (mini) {
        return (
            <span
                className={styled ? 'UserBadge mini styled' : 'UserBadge mini'}
            >
                <figure>{avatarDOM}</figure>
                <span className="username">
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
