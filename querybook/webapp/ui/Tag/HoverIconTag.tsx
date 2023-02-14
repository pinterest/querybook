import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

import { ITagProps, Tag, TagGroup } from './Tag';

export interface IHoverIconTagProps extends Omit<ITagProps, 'children'> {
    tagName: string;
    tagType?: string;
    tagIcon?: string;
    iconOnHover?: AllLucideIconNames;
    onIconHoverClick?: (e?: React.MouseEvent) => any;
}
export const HoverIconTag = React.forwardRef<
    HTMLSpanElement,
    IHoverIconTagProps
>(
    (
        {
            tagName,
            tagType,
            tagIcon,
            iconOnHover,
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

        const { tooltip, tooltipPos, color, mini, onClick } = tagProps;

        const iconDOM = tagIcon && (
            <Icon name={tagIcon as any} size={16} className="mr4" />
        );

        if (tagType) {
            return (
                <span
                    aria-label={tooltip}
                    data-balloon-pos={tooltipPos}
                    onClick={onClick}
                    ref={ref}
                    className={className}
                >
                    <TagGroup>
                        <Tag mini={mini}>
                            {iconDOM}
                            <span>{tagType}</span>
                        </Tag>
                        <Tag mini={mini} highlighted color={color}>
                            {tagName}
                            {hoverDOM}
                        </Tag>
                    </TagGroup>
                </span>
            );
        }

        return (
            <Tag {...tagProps} ref={ref} className={className}>
                {iconDOM}
                <span>{tagName}</span>
                {hoverDOM}
            </Tag>
        );
    }
);
