import React from 'react';
import clsx from 'clsx';
import { Icon } from 'ui/Icon/Icon';
import { TooltipDirection } from 'const/tooltip';

import './Tabs.scss';

export interface ITabItem {
    name?: string;
    icon?: string;
    key: string;
    tooltip?: string;
    tooltipPos?: TooltipDirection;
}

export interface ITabsProps {
    items: Array<ITabItem | string>;
    selectedTabKey?: string;
    onSelect: (key: string) => any;

    className?: string;
    vertical?: boolean;

    pills?: boolean;

    wide?: boolean;
    size?: 'small' | 'large';
    align?: 'right' | 'left' | 'center';
}

export const Tabs: React.FunctionComponent<ITabsProps> = ({
    items,
    selectedTabKey,
    onSelect,
    className,
    vertical,
    pills,
    wide,
    size = null,
    align = 'left',
}) => {
    const tabClassName = clsx({
        Tabs: true,
        [className]: Boolean(className),
        vertical,
        pills,
        wide,
        [size]: !!size,

        'center-align': align === 'center',
        'right-align': align === 'right',
    });

    const tabItemsDOM = items.map((item, index) => {
        let name: string;
        let key: string;
        let icon: string;
        const tooltipProps = {};

        if (typeof item === 'string') {
            name = item;
            key = item;
        } else {
            name = item.name;
            key = item.key;
            icon = item.icon;

            if (item.tooltip) {
                tooltipProps['aria-label'] = item.tooltip;
                tooltipProps['data-balloon-pos'] = item.tooltipPos ?? 'up';
            }
        }

        const selected = key === selectedTabKey;
        const liClassName = clsx({
            active: selected,
        });

        return (
            <li
                key={index}
                className={liClassName}
                onClick={
                    !selected && onSelect ? onSelect.bind(null, key) : null
                }
            >
                <a className="flex-center" {...tooltipProps}>
                    {icon && <Icon name={icon} />}
                    {name && <span>{name}</span>}
                </a>
            </li>
        );
    });

    return (
        <div className={tabClassName}>
            <ul>{tabItemsDOM}</ul>
        </div>
    );
};

Tabs.defaultProps = {
    className: '',
};
