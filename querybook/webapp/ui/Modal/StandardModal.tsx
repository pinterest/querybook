import clsx from 'clsx';
import React from 'react';

import { IStandardModalProps } from './types';
import { useAppBlur } from 'hooks/ui/useAppBlur';
import { AccentText } from 'ui/StyledText/StyledText';

export const StandardModal: React.FunctionComponent<IStandardModalProps> = ({
    className = '',
    children,
    onHide,
    title = null,
    topDOM = null,
    bottomDOM = null,
}) => {
    useAppBlur();
    const modalClassName = clsx({
        StandardModal: true,
        fullscreen: true,
        [className]: Boolean(className),
    });

    const modalTopDOM =
        title || topDOM ? (
            <AccentText className="Modal-top horizontal-space-between">
                {title && (
                    <AccentText size="xlarge" weight="extra" color="dark">
                        {title}
                    </AccentText>
                )}
                {topDOM}
            </AccentText>
        ) : null;

    const modalBottomDOM = bottomDOM ? (
        <div className="Modal-bottom">{bottomDOM}</div>
    ) : null;

    return (
        <div className={modalClassName}>
            <div className="Modal-background fullscreen" onClick={onHide} />
            <div className="Modal-box">
                {modalTopDOM}
                <div className="Modal-content">{children}</div>
                {modalBottomDOM}
            </div>
        </div>
    );
};
