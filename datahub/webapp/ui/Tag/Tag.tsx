import React from 'react';

import './Tag.scss';
import { Icon } from 'ui/Icon/Icon';
import { TooltipDirection } from 'const/tooltip';
import classNames from 'classnames';

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

    iconOnHover?: string;
    onHoverClick?: () => any;
}

export const TagGroup: React.FunctionComponent<ITagGroupProps> = ({
    className,
    children,
}) => {
    return <div className={`${className} TagGroup`}>{children}</div>;
};

export const Tag: React.FunctionComponent<ITagProps> = ({
    children,
    highlighted = false,
    tooltip,
    tooltipPos,
    onClick,
    iconOnHover,
    onHoverClick,
}) => {
    const tagProps = {};
    if (tooltip) {
        tagProps['aria-label'] = tooltip;
        tagProps['data-balloon-pos'] = tooltipPos;
    }

    const tagClassname = classNames({
        Tag: true,
        'flex-row': true,
        highlighted,
    });

    const hoverDOM = iconOnHover ? (
        <div className="Tag-hover" onClick={onHoverClick ?? null}>
            <Icon name={iconOnHover} />
        </div>
    ) : null;

    return (
        <span {...tagProps} className={tagClassname}>
            <div onClick={onClick ?? null}>{children}</div>
            {hoverDOM}
        </span>
    );
};
