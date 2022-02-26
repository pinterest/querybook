import React from 'react';

import { PopoverLayout, Popover, PopoverDirection } from 'ui/Popover/Popover';
import { useToggleState } from 'hooks/useToggleState';

import { SoftButton } from './Button';
import './InfoButton.scss';

interface ICommonInfoButtonProps {
    layout?: PopoverLayout;
    popoverClassName?: string;
}

type IIconInfoButtonProps = {
    type?: 'icon';
    /**
     * This is only used if type is button
     */
    title?: string;
} & ICommonInfoButtonProps;

type IButtonInfoButtonProps = {
    type: 'button';
    title: string;
} & ICommonInfoButtonProps;

export type IInfoButtonProps = IIconInfoButtonProps | IButtonInfoButtonProps;

export const InfoButton: React.FunctionComponent<IInfoButtonProps> = ({
    layout = ['top'] as [PopoverDirection],

    type,
    title,
    popoverClassName,
    children,
}) => {
    const [showInfo, setShowInfo, toggleShowInfo] = useToggleState(false);
    const buttonRef = React.useRef<HTMLElement>();
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

    return type === 'button' ? (
        <SoftButton
            ref={buttonRef}
            title={title}
            onClick={toggleShowInfo}
            icon="info"
        >
            {popover}
        </SoftButton>
    ) : (
        <span className="InfoButtonIcon" ref={buttonRef}>
            <i className="fas fa-info-circle" onClick={toggleShowInfo} />
            {popover}
        </span>
    );
};
