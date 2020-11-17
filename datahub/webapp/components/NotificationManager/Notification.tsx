import React from 'react';
import { animated } from 'react-spring';

import { IconButton } from 'ui/Button/IconButton';
import './Notification.scss';

interface INotificationProps {
    content: React.ReactNode;
    onHide: () => any;

    life?: number;
}

export const Notification: React.FunctionComponent<INotificationProps> = ({
    content,
    onHide,
    life,
}) => (
    <div className="Notification">
        <IconButton
            onClick={onHide}
            className="Notification-delete-btn"
            icon="x"
            noPadding
        />
        {content}
        <animated.div
            style={{
                right: `calc(${life * 100}%)`,
            }}
            className="notification-progress"
        />
    </div>
);
