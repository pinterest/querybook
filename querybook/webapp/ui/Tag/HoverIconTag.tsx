import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

import { ITagProps, Tag, TagGroup } from './Tag';

export interface IHoverIconTagProps extends Omit<ITagProps, 'children'> {
    name: string;
    type?: string;
    icon?: string;
    iconOnHover?: AllLucideIconNames;
    showType?: boolean;
    onIconHoverClick?: (e?: React.MouseEvent) => any;
}
export const HoverIconTag = React.forwardRef<
    HTMLSpanElement,
    IHoverIconTagProps
>(
    (
        {
            name,
            type,
            icon,
            iconOnHover,
            showType = true,
            onIconHoverClick,
            ...tagProps
        },
        ref
    ) => {
        const hoverDOM = iconOnHover ? (
            <div className="HoverIconTag-hover" onClick={onIconHoverClick}>
                <Icon name={iconOnHover} />
            </div>
        ) : null;

        const className = clsx(tagProps['className'], 'HoverIconTag');

        const iconDOM = icon && (
            <Icon name={icon as any} size={16} className="mr4" />
        );

        if (type && showType) {
            const { tooltip, tooltipPos, color, mini, onClick, ...extraProps } =
                tagProps;
            return (
                <TagGroup
                    tooltip={tooltip}
                    tooltipPos={tooltipPos}
                    className={className}
                    onClick={onClick}
                    ref={ref}
                >
                    <Tag mini={mini}>
                        {iconDOM}
                        <span>{type}</span>
                    </Tag>
                    <Tag mini={mini} highlighted color={color} {...extraProps}>
                        {name}
                        {hoverDOM}
                    </Tag>
                </TagGroup>
            );
        }

        return (
            <Tag {...tagProps} ref={ref} className={className}>
                {iconDOM}
                <span>{name}</span>
                {hoverDOM}
            </Tag>
        );
    }
);
