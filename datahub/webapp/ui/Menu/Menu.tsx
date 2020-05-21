import * as React from 'react';
import classNames from 'classnames';

import { calculateTooltipSize } from 'lib/utils';

import { DropdownMenu, IMenuItem } from 'ui/DropdownMenu/DropdownMenu';

import './Menu.scss';

interface IProps {
    items?: IMenuItem[];
    type?: 'select'; // Optional, One of none or 'select'
    className?: string;
    menuHeight?: number;
    soft?: boolean;
}

export const Menu: React.FunctionComponent<IProps> = ({
    items,
    type,
    className = '',

    menuHeight,
    soft,
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
            <span className="flex-row">
                {iconClass ? (
                    <span className="Menu-icon flex-center mr8">
                        <i className={iconClass} />
                    </span>
                ) : null}
                <span className="Menu-text">{action.name}</span>
            </span>
        );
        let itemDOM: React.ReactChild;
        if (action.items) {
            itemDOM = (
                <DropdownMenu
                    className={classNames({
                        'Dropdown-nested-menu': true,
                        'nested-right': className.includes('is-right'),
                        'Menu-item': true,
                    })}
                    key={index}
                    items={action.items}
                    customButtonRenderer={() => (
                        <a {...actionProps} className="flex-row">
                            {buttonContent}
                        </a>
                    )}
                />
            );
        } else {
            itemDOM = (
                <a {...actionProps} key={index} className="Menu-item">
                    {buttonContent}
                </a>
            );
        }

        return itemDOM;
    });

    return (
        <div
            className={classNames({
                Menu: true,
                'Menu-scroll': menuHeight != null,
                soft,
            })}
            style={
                menuHeight != null
                    ? {
                          maxHeight: menuHeight,
                      }
                    : {}
            }
        >
            {menuActionsDOM}
        </div>
    );
};
