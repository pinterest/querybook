import React from 'react';
import classNames from 'classnames';

import { calculateTooltipSize } from 'lib/utils';
import { TooltipDirection } from 'const/tooltip';

import { Dropdown } from 'ui/Dropdown/Dropdown';

import { Menu, MenuItem } from './Menu';

export interface IListMenuItem {
    checked?: boolean;
    icon?: string;
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
        const iconClass = isSelect
            ? action.checked
                ? 'fas fa-circle'
                : 'far fa-circle'
            : action.icon
            ? 'fa fa-' + action.icon
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
            actionProps['data-balloon-length'] = calculateTooltipSize(
                action.tooltip
            );
        }

        const buttonContent = (
            <span className="flex-row flex1">
                {iconClass ? (
                    <span className="Menu-icon flex-center mr8">
                        <i className={iconClass} />
                    </span>
                ) : null}
                <span className="Menu-text flex1">{action.name}</span>
            </span>
        );
        let itemDOM: React.ReactChild;
        if (action.items) {
            itemDOM = (
                <Dropdown
                    className={classNames({
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
                    {buttonContent}
                </MenuItem>
            );
        }

        return itemDOM;
    });

    return (
        <Menu
            height={height}
            className={classNames({
                soft,
                [className]: className,
            })}
        >
            {menuActionsDOM}
        </Menu>
    );
};
