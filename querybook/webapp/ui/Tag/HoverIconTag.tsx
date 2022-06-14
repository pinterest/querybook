import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { ITagProps, Tag } from './Tag';

export interface IHoverIconTagProps extends ITagProps {
    iconOnHover?: AllLucideIconNames;
    onIconHoverClick?: (e?: React.MouseEvent) => any;
}
export const HoverIconTag = React.forwardRef<
    HTMLSpanElement,
    IHoverIconTagProps
>(({ iconOnHover, onIconHoverClick, children, ...tagProps }, ref) => {
    const hoverDOM = iconOnHover ? (
        <div className="HoverIconTag-hover" onClick={onIconHoverClick}>
            <Icon name={iconOnHover} />
        </div>
    ) : null;

    const className = clsx(tagProps['className'], 'HoverIconTag');

    return (
        <Tag {...tagProps} ref={ref} className={className}>
            {children}
            {hoverDOM}
        </Tag>
    );
});
