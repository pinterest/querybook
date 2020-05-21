import classNames from 'classnames';
import React from 'react';

import { TooltipDirection } from 'const/tooltip';

import { IconButton } from 'ui/Button/IconButton';
import { Menu } from 'ui/Menu/Menu';

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
    soft?: boolean;
}

export const DropdownMenu: React.FunctionComponent<IProps> = ({
    hoverable = true,
    menuIcon = 'menu',

    className,
    customButtonRenderer,
    customMenuRenderer,

    items = [],
    type,
    menuHeight,
    soft,
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

    const buttonDOM = customButtonRenderer ? (
        customButtonRenderer()
    ) : (
        <IconButton icon={menuIcon} />
    );

    const customFormatClass = customButtonRenderer ? ' custom-format ' : '';

    const combinedClassName = classNames({
        DropdownMenu: true,
        'Dropdown-open': active,
        [className]: className,
        [customFormatClass]: true,
    });

    const dropdownMenuContent = active && (
        <>
            <Menu
                className={className}
                items={items}
                type={type}
                menuHeight={menuHeight}
                soft={soft}
            />
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
            <div className="Dropdown-trigger">{buttonDOM}</div>
            <div className="Dropdown-menu" role="menu">
                {dropdownMenuContent}
            </div>
        </div>
    );
};
