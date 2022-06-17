import clsx from 'clsx';
import React from 'react';

import { TooltipDirection } from 'const/tooltip';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { AccentText } from 'ui/StyledText/StyledText';

import { Menu, MenuItem } from './Menu';

export interface IListMenuItem {
    checked?: boolean;
    icon?: AllLucideIconNames;
    onClick?: () => any;
    link?: string;
    tooltip?: string;
    tooltipPos?: TooltipDirection;
    name: React.ReactChild;

    items?: IListMenuItem[];
}

interface IProps {
    items?: IListMenuItem[];
    type?: 'select'; // Optional, One of none or 'select'
    isRight?: boolean;
    height?: number;
    soft?: boolean;
    className?: string;
}

export const ListMenu: React.FunctionComponent<IProps> = ({
    items,
    type,
    isRight,

    height,
    soft,
    className,
}) => {
    if (!items || !items.length) {
        return null;
    }

    const isSelect = type === 'select';

    const menuActionsDOM = items.map((action, index) => {
        const iconName = isSelect
            ? action.checked
                ? 'CheckCircle'
                : 'Circle'
            : action.icon
            ? action.icon
            : null;

        const actionProps: React.HTMLProps<HTMLAnchorElement> = {};
        if (action.onClick) {
            actionProps.onClick = action.onClick;
        }
        if (action.link) {
            actionProps.href = action.link;
        }
        if (action.tooltip) {
            actionProps['aria-label'] = action.tooltip;
            actionProps['data-balloon-pos'] = action.tooltipPos || 'left';
        }

        const buttonContent = (
            <span className="flex-row flex1">
                {iconName ? (
                    <Icon name={iconName} className="mr8" size={16} />
                ) : null}
                <span className="Menu-text flex1">{action.name}</span>
            </span>
        );
        let itemDOM: React.ReactChild;
        if (action.items) {
            itemDOM = (
                <Dropdown
                    className={clsx({
                        'Dropdown-nested-menu': true,
                        'nested-right': isRight,
                        MenuItem: true,
                    })}
                    key={index}
                    customButtonRenderer={() => (
                        <a {...actionProps} className="flex-row">
                            {buttonContent}
                        </a>
                    )}
                >
                    <ListMenu items={action.items} />
                </Dropdown>
            );
        } else {
            itemDOM = (
                <MenuItem {...actionProps} key={index}>
                    <AccentText>{buttonContent}</AccentText>
                </MenuItem>
            );
        }

        return itemDOM;
    });

    return (
        <Menu
            height={height}
            className={clsx({
                soft,
                [className]: className,
            })}
        >
            {menuActionsDOM}
        </Menu>
    );
};
