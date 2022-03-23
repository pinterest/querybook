import React from 'react';
import clsx from 'clsx';

import { TooltipDirection } from 'const/tooltip';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

import './Tag.scss';

export interface ITagGroupProps {
    className?: string;
    children: React.ReactNode;
}

export interface ITagProps {
    children: React.ReactNode;

    highlighted?: boolean;
    mini?: boolean;
    light?: boolean;

    tooltip?: React.ReactNode;
    tooltipPos?: TooltipDirection;

    onClick?: () => any;

    className?: string;
}
export interface IHoverIconTagProps extends ITagProps {
    iconOnHover?: AllLucideIconNames;
    onIconHoverClick?: () => any;
}

export const TagGroup: React.FunctionComponent<ITagGroupProps> = ({
    className,
    children,
}) => <div className={`${className} TagGroup`}>{children}</div>;

export const Tag: React.FunctionComponent<ITagProps> = ({
    children,
    highlighted = false,
    tooltip,
    tooltipPos = 'top',
    onClick,
    className,
    mini,
    light,
}) => {
    const tooltipProps = {};
    if (tooltip) {
        tooltipProps['aria-label'] = tooltip;
        tooltipProps['data-balloon-pos'] = tooltipPos;
    }

    const tagClassname = clsx({
        Tag: true,
        'flex-row': true,
        highlighted,
        mini,
        light,
        [className]: Boolean(className),
    });

    return (
        <span {...tooltipProps} onClick={onClick} className={tagClassname}>
            {children}
        </span>
    );
};

export const HoverIconTag: React.FunctionComponent<IHoverIconTagProps> = ({
    iconOnHover,
    onIconHoverClick,
    children,
    ...tagProps
}) => {
    const hoverDOM = iconOnHover ? (
        <div className="HoverIconTag-hover" onClick={onIconHoverClick}>
            <Icon name={iconOnHover} />
        </div>
    ) : null;

    tagProps['className'] = (tagProps['className'] ?? '') + ' HoverIconTag';

    return (
        <Tag {...tagProps}>
            {children}
            {hoverDOM}
        </Tag>
    );
};
