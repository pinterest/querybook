import React from 'react';
import classNames from 'classnames';

import './Tabs.scss';

export interface ITabItem {
    name?: string;
    icon?: string;
    key: string;
}

export interface ITabsProps {
    items: Array<ITabItem | string>;
    selectedTabKey?: string;
    onSelect: (key: string) => any;

    className?: string;
    vertical?: boolean;
    borderless?: boolean;
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
    borderless,
    pills,
    wide,
    size = null,
    align = 'left',
}) => {
    const tabClassName = classNames({
        Tabs: true,
        [className]: Boolean(className),
        vertical,
        borderless,
        pills,
        wide,
        [size]: !!size,

        'center-align': align === 'center',
        'right-align': align === 'right',
    });

    const tabItemsDOM = items.map((item, index) => {
        let name: string;
        let key: string;

        if (typeof item === 'string') {
            name = item;
            key = item;
        } else {
            name = item.name;
            key = item.key;
        }

        const selected = key === selectedTabKey;
        const liClassName = classNames({
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
                <a>
                    <span>{name || key}</span>
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
