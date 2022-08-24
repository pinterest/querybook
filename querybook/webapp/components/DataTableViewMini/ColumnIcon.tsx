import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';

export interface IColumnIconProps {
    name?: AllLucideIconNames;
    tooltip?: string;
    fill?: boolean;
}

export const ColumnIcon: React.FunctionComponent<IColumnIconProps> = ({
    name,
    tooltip,
    fill,
}) => {
    const spanProps = {
        className: clsx({
            'flex-center': true,
        }),
    };
    if (tooltip) {
        spanProps['aria-label'] = tooltip;
        spanProps['data-balloon-pos'] = 'up';
    }

    return (
        <span {...spanProps}>
            <Icon name={name} size={16} fill={fill} />
        </span>
    );
};
