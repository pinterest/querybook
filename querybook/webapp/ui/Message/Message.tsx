import React from 'react';
import clsx from 'clsx';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { AccentText } from 'ui/StyledText/StyledText';

import './Message.scss';

export type MessageType = 'info' | 'error' | 'warning' | 'success' | 'tip';
export type MessageSize = 'small' | 'large';

export interface IMessageProps {
    title?: React.ReactNode;
    message?: React.ReactNode;
    className?: string;
    icon?: AllLucideIconNames;
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
    const messageClassName = clsx({
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
            <AccentText weight="bold">{messageTitle}</AccentText>
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
