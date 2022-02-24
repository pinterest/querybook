import React, { useMemo } from 'react';

import { useUser } from 'hooks/redux/useUser';
import { ICommonUserLoaderProps } from './types';

import { UserNameComponent } from './UserName';
import { UserAvatarComponent } from './UserAvatar';

import './UserBadge.scss';
import clsx from 'clsx';

type IProps = {
    isOnline?: boolean;
    mini?: boolean;
    cardStyle?: boolean;
} & ICommonUserLoaderProps;

export const UserBadge: React.FunctionComponent<IProps> = ({
    uid,
    name,
    isOnline,
    mini,
    cardStyle,
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
                className={clsx({
                    UserBadge: true,
                    mini: true,
                    'card-style': Boolean(cardStyle),
                })}
            >
                <figure>{avatarDOM}</figure>
                <span className="username">
                    {userInfo?.fullname ?? userName}
                </span>
            </span>
        );
    }

    return (
        <div
            className={clsx({
                UserBadge: true,
                'flex-row': true,
                'card-style': Boolean(cardStyle),
            })}
        >
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
