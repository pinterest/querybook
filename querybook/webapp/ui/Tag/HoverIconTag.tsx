import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { ITagProps, Tag } from './Tag';

export interface IHoverIconTagProps extends ITagProps {
    iconOnHover?: AllLucideIconNames;
    onIconHoverClick?: () => any;
}
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

    tagProps['className'] = clsx(tagProps['className'], 'HoverIconTag');

    return (
        <Tag {...tagProps}>
            {children}
            {hoverDOM}
        </Tag>
    );
};
