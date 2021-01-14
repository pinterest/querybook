import React from 'react';
import classNames from 'classnames';

import { TooltipDirection } from 'const/tooltip';

import { Icon } from 'ui/Icon/Icon';

import './IconButton.scss';

// A simple Bulma-based button
export interface IconButtonProps {
    icon: string;
    className?: string;
    onClick?: (event?: React.MouseEvent<HTMLSpanElement, MouseEvent>) => any;

    tooltip?: React.ReactNode;
    tooltipPos?: TooltipDirection;

    invertCircle?: boolean;
    disabled?: boolean;
    active?: boolean;
    noPadding?: boolean;
    fill?: boolean;
    size?: string | number;
    ping?: boolean | string;
    title?: string;
    // Bug: somehow typescript can't auto detect this field
    // after forwardRef
    children?: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLAnchorElement, IconButtonProps>(
    (
        {
            icon,
            children,
            onClick,
            className = '',
            tooltip,
            tooltipPos = 'up',
            disabled,
            invertCircle,
            active,
            size,
            noPadding,
            fill,
            ping,
            title,
        },
        ref
    ) => {
        const iconButtonProps = {
            ref,
            onClick: disabled ? null : onClick,
        };

        if (tooltip) {
            iconButtonProps['aria-label'] = tooltip;
            iconButtonProps['data-balloon-pos'] = tooltipPos;
        }

        const iconButtonClassname = classNames({
            IconButton: true,
            active,
            'no-padding': noPadding,
            fill,
            disabled,
            'invert-circle': invertCircle,
            'with-title': !!title,
            [className]: className,
        });

        const pingDOM = !ping ? null : typeof ping === 'boolean' ? (
            <div className="ping" />
        ) : (
            <div className="ping-message">{ping}</div>
        );
        const iconDOM = <Icon name={icon} size={size} fill={fill} />;
        const contentDOM = title ? (
            <div className="flex-column">
                {iconDOM}
                <span className="icon-title">{title}</span>
            </div>
        ) : (
            iconDOM
        );

        return (
            <span {...iconButtonProps} className={iconButtonClassname}>
                {pingDOM}
                {contentDOM} {children}
            </span>
        );
    }
);
