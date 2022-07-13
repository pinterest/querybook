import clsx from 'clsx';
import React from 'react';

import { useEvent } from 'hooks/useEvent';
import { IconButton } from 'ui/Button/IconButton';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { AccentText } from 'ui/StyledText/StyledText';

import './Dropdown.scss';

const defaultLayout: PopoverLayout = [
    'bottom', // main axis, the menu opens from the bottom side
    'left', // off axis, determines if menu aligns right or left
];
interface IProps {
    menuIcon?: AllLucideIconNames;
    className?: string;
    customButtonRenderer?: () => React.ReactNode;

    hoverable?: boolean;
    layout?: PopoverLayout;

    usePortal?: boolean;
}

export const Dropdown: React.FunctionComponent<IProps> = ({
    menuIcon = 'Menu',
    className,
    customButtonRenderer,

    hoverable = true,
    layout = defaultLayout,
    usePortal,

    children,
}) => {
    const selfRef = React.useRef<HTMLDivElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);

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
        (event: MouseEvent) => {
            if (
                !(
                    event.composedPath().includes(selfRef.current) ||
                    (popoverRef.current &&
                        event.composedPath().includes(popoverRef.current))
                )
            ) {
                setActive(false);
            }
        },
        [selfRef.current]
    );
    useEvent('mousedown', onDocumentClick, {
        element: document,
        disabled: hoverable || !active,
    });

    const buttonDOM = customButtonRenderer ? (
        customButtonRenderer()
    ) : (
        <IconButton icon={menuIcon} noPadding />
    );

    const customFormatClass = customButtonRenderer ? ' custom-format ' : '';

    let dropdownContent =
        active && children ? (
            <div className="Dropdown-menu" role="menu">
                {children}
            </div>
        ) : null;

    if (usePortal && dropdownContent) {
        dropdownContent = (
            <Popover
                ref={popoverRef}
                onHide={() => setActive(false)}
                anchor={selfRef.current}
                layout={layout}
                hideArrow
                skipAnimation
                noPadding
            >
                {dropdownContent}
            </Popover>
        );
    }

    const mainAxis = layout[0];
    const offAxis =
        layout.length > 1
            ? layout[1]
            : mainAxis === 'left' || mainAxis === 'right'
            ? 'top'
            : 'right';
    const combinedClassName = clsx({
        Dropdown: true,
        [className]: className,
        [customFormatClass]: true,
        [`opens-${mainAxis}`]: !usePortal,
        [`aligns-${offAxis}`]: !usePortal,
    });

    return (
        <div
            className={combinedClassName}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseExit}
            onClick={handleClick}
            ref={selfRef}
        >
            <AccentText className="Dropdown-trigger" weight="bold">
                {buttonDOM}
            </AccentText>
            {dropdownContent}
        </div>
    );
};
