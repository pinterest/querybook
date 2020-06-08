import React from 'react';

import { useUser } from 'hooks/redux/useUser';

import { UserNameComponent } from './UserName';
import { UserAvatarComponent } from './UserAvatar';
import './UserBadge.scss';
import { Title } from 'ui/Title/Title';

export interface IProps {
    uid: number;
    isOnline?: boolean;
    mini?: boolean;
}

export interface IState {
    loading: boolean;
}

export const UserBadge: React.FunctionComponent<IProps> = ({
    uid,
    isOnline,
    mini,
}) => {
    const { loading, userInfo } = useUser(uid);

    const avatarDOM = (
        <UserAvatarComponent
            userInfo={userInfo}
            loading={loading}
            isOnline={isOnline}
        />
    );

    const userName = (userInfo ? userInfo.username : '').toLocaleLowerCase();

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
                <Title size={4} className="user-name">
                    <UserNameComponent userInfo={userInfo} loading={loading} />
                </Title>
                <Title subtitle size={6}>
                    @{userName}
                </Title>
            </div>
        </div>
    );
};
