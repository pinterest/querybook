import clsx from 'clsx';
import React, { useState } from 'react';

import { Popover, PopoverDirection, PopoverLayout } from 'ui/Popover/Popover';

import { IconButton } from './IconButton';

import './InfoButton.scss';

interface IInfoButtonProps {
    layout?: PopoverLayout;
    popoverClassName?: string;
    title?: string;
}

export const InfoButton: React.FunctionComponent<IInfoButtonProps> = ({
    layout = ['top'] as [PopoverDirection],

    popoverClassName,
    children,
}) => {
    const [showInfo, setShowInfo] = useState(false);
    const handleMouseEnter = React.useCallback(() => {
        setShowInfo(true);
    }, [setShowInfo]);
    const handleMouseExit = React.useCallback(() => {
        setShowInfo(false);
    }, [setShowInfo]);

    const buttonRef = React.useRef<HTMLElement>();
    const popover = showInfo && (
        <Popover
            anchor={buttonRef.current}
            layout={layout}
            onHide={() => setShowInfo(false)}
            resizeOnChange
            noPadding
        >
            <div className={clsx('info-button-popover', popoverClassName)}>
                {children}
            </div>
        </Popover>
    );

    return (
        <span
            className="InfoButtonIcon"
            ref={buttonRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseExit}
        >
            <IconButton icon="Info" size={18} noPadding />
            {popover}
        </span>
    );
};
