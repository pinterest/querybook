import clsx from 'clsx';
import React from 'react';

import { IUserAvatarProps, UserAvatar } from './UserAvatar';

import './UserAvatarList.scss';

interface IUserAvatarListProps {
    users: Array<
        IUserAvatarProps & {
            tooltip?: string;
        }
    >;
    extraCount?: number;
}

export const UserAvatarList: React.FC<IUserAvatarListProps> = ({
    users,
    extraCount = 0,
}) => {
    const userAvatarDOM = (users || []).map((user) => {
        const { tooltip, ...userAvatarProps } = user;
        return (
            <div
                className="UserAvatarList-user-wrapper"
                key={userAvatarProps.uid}
            >
                <div
                    className={clsx({
                        'UserAvatarList-user': true,
                    })}
                    aria-label={tooltip}
                    data-balloon-pos={'down'}
                >
                    <UserAvatar {...userAvatarProps} />
                </div>
            </div>
        );
    });

    const extraViewersDOM = extraCount > 0 && (
        <div
            className="UserAvatarList-user-wrapper extra-user-count"
            key={'count'}
            aria-label={`${extraCount} Others`}
            data-balloon-pos={'down'}
        >
            <div className="UserAvatarList-user">
                {extraCount < 100 ? extraCount : '*'}
            </div>
        </div>
    );

    return (
        <div className="UserAvatarList">
            {userAvatarDOM}
            {extraViewersDOM}
        </div>
    );
};
