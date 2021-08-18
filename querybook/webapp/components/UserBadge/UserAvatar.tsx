import React, { useEffect } from 'react';

import { useUser } from 'hooks/redux/useUser';
import { IUserInfo } from 'const/user';
import { ICommonUserLoaderProps } from './types';
import './UserAvatar.scss';

export type IUserAvatarProps = {
    isOnline?: boolean;
    tiny?: boolean;
    onClick?: () => any;
} & ICommonUserLoaderProps;

export interface IUserAvatarComponentProps
    extends Omit<IUserAvatarProps, 'uid' | 'name'> {
    loading: boolean;
    userInfo: IUserInfo;
    onClick?: () => any;
}

const defaultNoUserBackground = '#F65B50';
const defaultUserIconBackgrounds = [
    '#FF6400',
    '#FAB904',
    '#0FA573',
    '#4A90E2',
    '#B469EB',
];

function getUserIconBackgroundColor(name: string) {
    let charCodeSum = 0;
    for (const c of name) {
        charCodeSum += c.charCodeAt(0);
    }

    return defaultUserIconBackgrounds[
        charCodeSum % defaultUserIconBackgrounds.length
    ];
}

const DefaultUserIcon: React.FunctionComponent<{
    name: string | null;
}> = ({ name }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const text = name ? name[0].toUpperCase() : '?';
        const backgroundColor = name
            ? getUserIconBackgroundColor(name)
            : defaultNoUserBackground;

        const ctx = canvasRef.current.getContext('2d');
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.fillStyle = backgroundColor;
        ctx.fill();

        const fontSize = width / 2;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = 'white';

        const { width: textWidth } = ctx.measureText(text);
        ctx.fillText(
            text,
            width / 2 - textWidth / 2,
            height / 2 + textWidth / 2
        );
    }, [canvasRef, name]);

    return <canvas ref={canvasRef} width="100px" height="100px" />;
};

export const UserAvatarComponent: React.FunctionComponent<IUserAvatarComponentProps> = ({
    loading,
    userInfo,
    isOnline,
    tiny,
    onClick = null,
}) => {
    const profileImage = userInfo ? userInfo.profile_img : null;
    const userName = userInfo ? userInfo.fullname ?? userInfo.username : null;

    const imageDOM = loading ? (
        <div className="spinner-wrapper">
            <span>
                <i className="fa fa-spinner fa-pulse" />
            </span>
        </div>
    ) : profileImage == null ? (
        <DefaultUserIcon name={userName} />
    ) : (
        <img src={profileImage} />
    );

    const isOnlineClasses = isOnline
        ? 'is-online-dot online'
        : 'is-online-dot offline';

    const isOnlineDot =
        isOnline === undefined ? null : <span className={isOnlineClasses} />;

    return tiny ? (
        <span className="UserAvatar tiny" onClick={onClick}>
            {imageDOM}
        </span>
    ) : (
        <span className="UserAvatar" onClick={onClick}>
            {imageDOM}
            {isOnlineDot}
        </span>
    );
};

export const UserAvatar: React.FunctionComponent<IUserAvatarProps> = ({
    uid,
    name,
    tiny,
    isOnline,
    onClick = null,
}) => {
    const { loading, userInfo } = useUser({ uid, name });

    return (
        <UserAvatarComponent
            userInfo={userInfo}
            loading={loading}
            isOnline={isOnline}
            tiny={tiny}
            onClick={onClick}
        />
    );
};
