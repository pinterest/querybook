import clsx from 'clsx';
import React, { useMemo } from 'react';

import { UserGroupCard } from 'components/UserGroupCard/UserGroupCard';
import { DELETED_USER_MSG } from 'const/user';
import { useUser } from 'hooks/redux/useUser';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { AccentText } from 'ui/StyledText/StyledText';

import { ICommonUserLoaderProps } from './types';
import { UserAvatarComponent } from './UserAvatar';
import { UserNameComponent } from './UserName';

import './UserBadge.scss';

type IProps = {
    isOnline?: boolean;
    mini?: boolean;
    cardStyle?: boolean;
    groupPopover?: boolean;
} & ICommonUserLoaderProps;

export const UserBadge: React.FunctionComponent<IProps> = ({
    uid,
    name,
    isOnline,
    mini,
    cardStyle,
    groupPopover = true,
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

    const deletedText = userInfo?.deleted ? DELETED_USER_MSG : '';

    const badgeDOM = mini ? (
        <span
            className={clsx({
                UserBadge: true,
                mini: true,
                'card-style': cardStyle,
            })}
        >
            <figure>{avatarDOM}</figure>
            <AccentText className="username" weight="bold">
                {userInfo?.fullname ?? userName} {deletedText}
            </AccentText>
        </span>
    ) : (
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
            <div className="UserBadge-names">
                <AccentText
                    className="username one-line-ellipsis mb4"
                    size="med"
                    weight="extra"
                    color="dark"
                >
                    <UserNameComponent userInfo={userInfo} loading={loading} />
                </AccentText>
                <AccentText className="handle" size="small" color="light">
                    @{userName} {deletedText}
                </AccentText>
            </div>
        </div>
    );

    return groupPopover && userInfo?.is_group ? (
        <PopoverHoverWrapper>
            {(showPopover, anchorElement) => (
                <>
                    {badgeDOM}

                    {showPopover && (
                        <Popover
                            onHide={() => null}
                            anchor={anchorElement}
                            layout={['right', 'top']}
                        >
                            <UserGroupCard userGroup={userInfo} />
                        </Popover>
                    )}
                </>
            )}
        </PopoverHoverWrapper>
    ) : (
        badgeDOM
    );
};
