import React from 'react';
import clsx from 'clsx';

import { TooltipDirection } from 'const/tooltip';

import { TButtonColors, Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import './IconButton.scss';

// A simple Bulma-based button
export interface IIconButtonProps {
    icon: AllLucideIconNames;
    className?: string;
    onClick?: (event?: React.MouseEvent<HTMLSpanElement, MouseEvent>) => any;

    tooltip?: React.ReactNode;
    tooltipPos?: TooltipDirection;

    invertCircle?: boolean;
    disabled?: boolean;
    active?: boolean;
    noPadding?: boolean;
    fill?: boolean;
    color?: TButtonColors;
    size?: string | number;
    ping?: boolean | string;
    title?: string;
    // Bug: somehow typescript can't auto detect this field
    // after forwardRef
    children?: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLAnchorElement, IIconButtonProps>(
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
            color,
        },
        ref
    ) => {
        const IIconButtonProps = {
            ref,
            onClick: disabled ? null : onClick,
        };

        if (tooltip) {
            IIconButtonProps['aria-label'] = tooltip;
            IIconButtonProps['data-balloon-pos'] = tooltipPos;
        }

        const iconButtonClassname = clsx({
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
            <StyledText
                className="ping-message"
                color="accent-dark"
                size="xsmall"
                weight="bold"
            >
                {ping}
            </StyledText>
        );
        const iconDOM = (
            <Icon name={icon} size={size} fill={fill} color={color} />
        );
        const contentDOM = title ? (
            <div className="flex-column">
                {iconDOM}
                <AccentText
                    className="icon-title"
                    size="xxxsmall"
                    weight="light"
                >
                    {title}
                </AccentText>
            </div>
        ) : (
            iconDOM
        );

        return (
            <span {...IIconButtonProps} className={iconButtonClassname}>
                {pingDOM}
                {contentDOM} {children}
            </span>
        );
    }
);
