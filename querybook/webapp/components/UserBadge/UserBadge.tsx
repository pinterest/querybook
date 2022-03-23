import React, { useMemo } from 'react';

import { useUser } from 'hooks/redux/useUser';
import { ICommonUserLoaderProps } from './types';

import { UserNameComponent } from './UserName';
import { UserAvatarComponent } from './UserAvatar';

import './UserBadge.scss';
import clsx from 'clsx';
import { AccentText } from 'ui/StyledText/StyledText';

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
                    'card-style': cardStyle,
                })}
            >
                <figure>{avatarDOM}</figure>
                <AccentText className="username" weight="bold">
                    {userInfo?.fullname ?? userName}
                </AccentText>
            </span>
        );
    }

    return (
        <div
            className={clsx({
                UserBadge: true,
                'flex-row': true,
                'card-style': cardStyle,
            })}
        >
            <div className="UserBadge-icon">
                <figure>{avatarDOM}</figure>
            </div>
            <div className="UserBadge-names flex-column">
                <AccentText
                    className="username one-line-ellipsis mb4"
                    size="med"
                    weight="extra"
                    color="dark"
                >
                    <UserNameComponent userInfo={userInfo} loading={loading} />
                </AccentText>
                <AccentText className="handle" size="small" color="light">
                    @{userName}
                </AccentText>
            </div>
        </div>
    );
};
