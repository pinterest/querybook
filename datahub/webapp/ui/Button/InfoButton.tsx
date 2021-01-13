import React from 'react';
import { PopoverLayout, Popover, PopoverDirection } from 'ui/Popover/Popover';
import './InfoButton.scss';

export interface IInfoButtonProps {
    layout?: PopoverLayout;
    popoverClassName?: string;
}

export const InfoButton: React.FunctionComponent<IInfoButtonProps> = ({
    layout = ['top'] as [PopoverDirection],

    children,
    popoverClassName,
}) => {
    const [showInfo, setShowInfo] = React.useState(false);
    const buttonRef = React.useRef<HTMLSpanElement>();

    const popover = showInfo && (
        <Popover
            anchor={buttonRef.current}
            layout={layout}
            onHide={() => setShowInfo(false)}
            resizeOnChange
        >
            <div
                className={
                    popoverClassName
                        ? `info-button-popover ${popoverClassName}`
                        : 'info-button-popover '
                }
            >
                {children}
            </div>
        </Popover>
    );

    return (
        <span className="InfoButton" ref={buttonRef}>
            <i
                className="fas fa-info-circle"
                onClick={() => setShowInfo(!showInfo)}
            />
            {popover}
        </span>
    );
};
