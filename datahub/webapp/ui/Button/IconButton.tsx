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

    disabled?: boolean;
    active?: boolean;
    noPadding?: boolean;
    fill?: boolean;
    size?: string | number;
    ping?: boolean | string;
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

            active,
            size,
            noPadding,
            fill,
            ping,
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
            [className]: className,
        });

        return (
            <span {...iconButtonProps} className={iconButtonClassname}>
                {!ping ? null : typeof ping === 'boolean' ? (
                    <div className="ping" />
                ) : (
                    <div className="ping-message">{ping}</div>
                )}
                <Icon name={icon} size={size} fill={fill} /> {children}
            </span>
        );
    }
);
