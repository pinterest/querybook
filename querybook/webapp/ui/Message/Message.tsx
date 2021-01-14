import React from 'react';
import classNames from 'classnames';

import { Icon } from 'ui/Icon/Icon';

import './Message.scss';

export type MessageType = 'info' | 'error' | 'warning' | 'success' | 'tip';
export type MessageSize = 'small' | 'large';

export interface IMessageProps {
    title?: React.ReactNode;
    message?: React.ReactNode;
    className?: string;
    icon?: string;
    iconSize?: number;
    type?: MessageType;
    size?: MessageSize;
    center?: boolean;
}

export const Message: React.FunctionComponent<IMessageProps> = ({
    title,
    message,
    children,
    className = '',
    icon = null,
    iconSize = null,
    type = null,
    size = null,
    center = false,
}) => {
    const messageClassName = classNames({
        Message: true,
        'Message-simple': !title,
        'Message-has-icon': !!icon,
        [type]: !!type,
        [size]: !!size,
        center,
        [className]: Boolean(className),
    });
    const messageTitle = title ? (
        <div className="Message-header">
            <p>{title}</p>
        </div>
    ) : null;

    const messageBody = message ? message : children ? children : null;

    return (
        <article className={messageClassName}>
            {messageTitle}
            <div className="Message-body">
                {icon && (
                    <Icon
                        className="Message-icon"
                        name={icon}
                        size={iconSize}
                    />
                )}
                {messageBody}
            </div>
        </article>
    );
};
