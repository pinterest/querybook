import React from 'react';
import classNames from 'classnames';

import { TooltipDirection } from 'const/tooltip';

import { Icon } from 'ui/Icon/Icon';

import './Tag.scss';

export interface ITagGroupProps {
    className?: string;
    children: React.ReactNode;
}

export interface ITagProps {
    children: React.ReactNode;

    highlighted?: boolean;

    tooltip?: React.ReactNode;
    tooltipPos?: TooltipDirection;

    onClick?: () => any;

    className?: string;
}
export interface IHoverIconTagProps extends ITagProps {
    iconOnHover?: string;
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
}) => {
    const tooltipProps = {};
    if (tooltip) {
        tooltipProps['aria-label'] = tooltip;
        tooltipProps['data-balloon-pos'] = tooltipPos;
    }

    const tagClassname = classNames({
        Tag: true,
        'flex-row': true,
        highlighted,
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
