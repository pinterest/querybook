import clsx from 'clsx';
import React from 'react';

import { IStandardModalProps } from './types';

import { IconButton } from 'ui/Button/IconButton';

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
        <>
            <IconButton
                className="Modal-close"
                aria-label="close"
                icon="x"
                onClick={onHide}
            />
            {title !== null ? <div className="Modal-title">{title}</div> : null}
        </>
    );

    return (
        <div className={modalClassName}>
            {modalTitleDOM}
            <div className="Modal-content">{children}</div>
        </div>
    );
};
