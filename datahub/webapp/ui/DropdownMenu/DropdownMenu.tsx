import classNames from 'classnames';
import React from 'react';

import { IconButton } from 'ui/Button/IconButton';

import './DropdownMenu.scss';

interface IProps {
    menuIcon?: string;
    className?: string;
    customButtonRenderer?: () => React.ReactNode;
    customMenuRenderer?: () => React.ReactNode;
    hoverable?: boolean;
}

export const DropdownMenu: React.FunctionComponent<IProps> = ({
    hoverable = true,
    menuIcon = 'menu',
    className,
    customButtonRenderer,

    children,
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

    return (
        <div
            className={combinedClassName}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseExit}
            onClick={handleClick}
            ref={selfRef}
        >
            <div className="Dropdown-trigger">{buttonDOM}</div>
            <div className="Dropdown-menu pt4" role="menu">
                {active && children}
            </div>
        </div>
    );
};
