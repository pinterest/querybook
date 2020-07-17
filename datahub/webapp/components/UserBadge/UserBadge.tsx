import React, { useMemo } from 'react';

import { useUser } from 'hooks/redux/useUser';
import { Title } from 'ui/Title/Title';

import { UserNameComponent } from './UserName';
import { UserAvatarComponent } from './UserAvatar';
import { ICommonUserLoaderProps } from './types';
import './UserBadge.scss';

type IProps = {
    isOnline?: boolean;
    mini?: boolean;
} & ICommonUserLoaderProps;

export interface IState {
    loading: boolean;
}

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

    const userName = useMemo(() => {
        return userInfo
            ? userInfo.fullname ?? userInfo.username
            : name
            ? `Unknown (${name})`
            : 'Unknown';
    }, [userInfo?.username, name]);

    if (mini) {
        return (
            <span className="UserBadge mini">
                <figure>{avatarDOM}</figure>
                <span className="user-name">{userName}</span>
            </span>
        );
    }

    return (
        <div className="UserBadge flex-row">
            <div className="UserBadge-icon">
                <figure>{avatarDOM}</figure>
            </div>
            <div className="UserBadge-names">
                <Title size={4} className="user-name one-line-ellipsis">
                    <UserNameComponent userInfo={userInfo} loading={loading} />
                </Title>
                <Title subtitle size={6}>
                    @{userName}
                </Title>
            </div>
        </div>
    );
};
