import clsx from 'clsx';
import React from 'react';

import { IStandardModalProps } from './types';

import { IconButton } from 'ui/Button/IconButton';
import { AccentText } from 'ui/StyledText/StyledText';

export const FullScreenModal: React.FunctionComponent<IStandardModalProps> = ({
    className = '',
    title,
    onHide,
    children,
}) => {
    const modalClassName = clsx({
        FullScreenModal: true,
        fullscreen: true,
        [className]: Boolean(className),
    });

    const modalTitleDOM = (
        <div className="Modal-top horizontal-space-between">
            <AccentText size="text" weight="bold">
                {title}
            </AccentText>
            <IconButton
                aria-label="close"
                icon="X"
                onClick={onHide}
                noPadding
            />
        </div>
    );

    return (
        <div className={modalClassName}>
            {title && modalTitleDOM}
            <div className="Modal-content">{children}</div>
        </div>
    );
};
