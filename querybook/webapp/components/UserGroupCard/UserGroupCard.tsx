import React, { useEffect, useState } from 'react';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { IUserInfo } from 'const/user';
import { UserResource } from 'resource/user';
import { AccentText } from 'ui/StyledText/StyledText';

import './UserGroupCard.scss';

interface IProps {
    userGroup: IUserInfo;
}

export const UserGroupCard = ({ userGroup }: IProps) => {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        UserResource.getUserGroupMembers(userGroup.id).then(({ data }) => {
            setMembers(data);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="UserGroupCard">
            <div>
                <AccentText color="dark" weight="bold">
                    {userGroup.fullname}
                </AccentText>
                <AccentText color="light">{userGroup.username}</AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold">
                    Email
                </AccentText>
                <AccentText color="light">{userGroup.email}</AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold">
                    Description
                </AccentText>
                <AccentText color="light">
                    {userGroup.properties?.description}
                </AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold">
                    Group members
                </AccentText>
                <div className="members-container">
                    {members.map((m) => (
                        <div key={m.id} className="ml8">
                            <UserBadge uid={m.id} mini />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
