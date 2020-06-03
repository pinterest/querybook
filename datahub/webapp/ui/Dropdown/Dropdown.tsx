import classNames from 'classnames';
import React from 'react';

import { IconButton } from 'ui/Button/IconButton';
import { Popover } from 'ui/Popover/Popover';

import './Dropdown.scss';

interface IProps {
    menuIcon?: string;
    className?: string;
    customButtonRenderer?: () => React.ReactNode;

    hoverable?: boolean;
    isRight?: boolean;
    isUp?: boolean;

    usePortal?: boolean;
}

export const Dropdown: React.FunctionComponent<IProps> = ({
    menuIcon = 'menu',
    className,
    customButtonRenderer,

    hoverable = true,
    isRight,
    isUp,
    usePortal,

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
        Dropdown: true,
        [className]: className,
        [customFormatClass]: true,
        'is-right': isRight,
        'is-up': isUp,
    });

    let dropdownContent =
        active && children ? (
            <div className="Dropdown-menu" role="menu">
                {children}
            </div>
        ) : null;
    if (usePortal && dropdownContent) {
        dropdownContent = (
            <Popover
                onHide={() => setActive(false)}
                anchor={selfRef.current}
                layout={[isUp ? 'top' : 'bottom', isRight ? 'right' : 'left']}
                hideArrow
                skipAnimation
            >
                {dropdownContent}
            </Popover>
        );
    }

    return (
        <div
            className={combinedClassName}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseExit}
            onClick={handleClick}
            ref={selfRef}
        >
            <div className="Dropdown-trigger">{buttonDOM}</div>
            {dropdownContent}
        </div>
    );
};
