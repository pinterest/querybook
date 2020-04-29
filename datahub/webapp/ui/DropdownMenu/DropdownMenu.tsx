import classNames from 'classnames';
import React from 'react';

import { TooltipDirection } from 'const/tooltip';
import { calculateTooltipSize } from 'lib/utils';
import { IconButton } from 'ui/Button/IconButton';

import './DropdownMenu.scss';

export interface IMenuItem {
    checked?: boolean;
    icon?: string;
    onClick?: () => any;
    link?: string;
    tooltip?: string;
    tooltipPos?: TooltipDirection;
    name: React.ReactChild;

    items?: IMenuItem[];
}

interface IProps {
    items?: IMenuItem[];
    menuIcon?: string;
    type?: 'select'; // Optional, One of none or 'select'
    className?: string;
    customButtonRenderer?: () => React.ReactNode;
    customMenuRenderer?: () => React.ReactNode;
    hoverable?: boolean;

    // If provided, then menu will overflow
    menuHeight?: number;
}

export const DropdownMenu: React.FunctionComponent<IProps> = ({
    hoverable = true,
    menuIcon = 'menu',
    items = [],

    type,
    className,
    customButtonRenderer,
    customMenuRenderer,
    menuHeight,
}) => {
    const selfRef = React.useRef<HTMLDivElement>(null);
    const [active, setActive] = React.useState(false);
    // Hover Based Dropdown control
    const handleMouseEnter = React.useCallback(() => {
        if (hoverable) {
            setActive(true);
        }
    }, [hoverable]);
    const handleMouseExit = React.useCallback(() => {
        if (hoverable) {
            setActive(false);
        }
    }, [hoverable]);

    // Click based Dropdown Control
    const handleClick = React.useCallback((event) => {
        if (!hoverable) {
            event.stopPropagation();
            event.preventDefault();
            setActive(true);
        }
    }, []);
    const onDocumentClick = React.useCallback(
        (event) => {
            if (!event.composedPath().includes(selfRef.current)) {
                setActive(false);
            }
        },
        [selfRef.current]
    );

    React.useEffect(() => {
        if (!hoverable && active) {
            document.addEventListener('mousedown', onDocumentClick);
        }
        return () => {
            if (!hoverable && active) {
                document.removeEventListener('mousedown', onDocumentClick);
            }
        };
    }, [hoverable, active, onDocumentClick]);

    className = className || '';

    const generateMenuDOM = () => {
        if (!items || !items.length) {
            return null;
        }

        const isSelect = type === 'select';

        const menuActionsDOM = items.map((action, index) => {
            const iconClass = isSelect
                ? action.checked
                    ? 'fas fa-circle'
                    : 'far fa-circle'
                : 'fa fa-' + action.icon;

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
                <>
                    <span className="action-icon">
                        <i className={iconClass} />
                    </span>
                    &nbsp;
                    <span className="action-name">{action.name}</span>
                </>
            );
            let itemDOM: React.ReactChild;
            if (action.items) {
                itemDOM = (
                    <DropdownMenu
                        className={classNames({
                            'dropdown-item': true,
                            'dropdown-nested-menu': true,
                            'nested-right': className.includes('is-right'),
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
                    <a {...actionProps} key={index} className="dropdown-item">
                        {buttonContent}
                    </a>
                );
            }

            return itemDOM;
        });

        return (
            <div
                className={classNames({
                    'dropdown-content': true,
                    'dropdown-content-scroll': menuHeight != null,
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

    const buttonDOM = customButtonRenderer ? (
        customButtonRenderer()
    ) : (
        <IconButton icon={menuIcon} />
    );

    const customFormatClass = customButtonRenderer ? ' custom-format ' : '';

    const combinedClassName = classNames({
        dropdown: true,
        'dropdown-open': active,
        [className]: className,
        [customFormatClass]: true,
    });

    const dropdownMenuContent = active && (
        <>
            {generateMenuDOM()}
            {customMenuRenderer && customMenuRenderer()}
        </>
    );

    return (
        <div
            className={combinedClassName}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseExit}
            onClick={handleClick}
            ref={selfRef}
        >
            <div className="dropdown-trigger">{buttonDOM}</div>
            <div className={'dropdown-menu'} role="menu">
                {dropdownMenuContent}
            </div>
        </div>
    );
};
