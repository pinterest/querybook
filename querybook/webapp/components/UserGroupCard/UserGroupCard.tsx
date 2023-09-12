import React, { useCallback } from 'react';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { MAX_USER_GROUP_MEMBERS_TO_SHOW } from 'const/uiConfig';
import { IUserInfo } from 'const/user';
import { useResource } from 'hooks/useResource';
import { UserResource } from 'resource/user';
import { AccentText } from 'ui/StyledText/StyledText';

import './UserGroupCard.scss';

interface IProps {
    userGroup: IUserInfo;
}

export const UserGroupCard = ({ userGroup }: IProps) => {
    const { data: members } = useResource(
        useCallback(
            () => UserResource.getUserGroupMembers(userGroup.id),
            [userGroup.id]
        )
    );

    const membersDOM = members && (
        <>
            {members.slice(0, MAX_USER_GROUP_MEMBERS_TO_SHOW).map((m) => (
                <div key={m.id} className="flex-row ml8">
                    <UserBadge uid={m.id} mini />
                </div>
            ))}
            {members.length > MAX_USER_GROUP_MEMBERS_TO_SHOW && (
                <div className="ml8"> and more</div>
            )}
        </>
    );

    return (
        <div className="UserGroupCard">
            <div>
                <AccentText color="dark" weight="bold" size="xsmall">
                    {userGroup.fullname ?? userGroup.username}
                </AccentText>
                <AccentText color="light" size="xsmall">
                    {userGroup.username}
                </AccentText>
            </div>
            {userGroup.email && (
                <div className="mt8">
                    <AccentText color="dark" weight="bold" size="xsmall">
                        Email
                    </AccentText>
                    <AccentText color="light" size="xsmall">
                        {userGroup.email}
                    </AccentText>
                </div>
            )}
            <div className="mt8">
                <AccentText color="dark" weight="bold" size="xsmall">
                    Description
                </AccentText>
                <AccentText color="light" size="xsmall">
                    {userGroup.properties.description}
                </AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold" size="xsmall">
                    Group members
                </AccentText>
                <div className="members-container">{membersDOM}</div>
            </div>
        </div>
    );
};
