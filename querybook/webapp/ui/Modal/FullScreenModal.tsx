import clsx from 'clsx';
import React from 'react';
import { IStandardModalProps } from './types';
import { IconButton } from 'ui/Button/IconButton';

export const FullScreenModal: React.FunctionComponent<IStandardModalProps> = ({
    hideClose = false,
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

    const closeButton = !hideClose ? (
        <IconButton
            className="Modal-close"
            aria-label="close"
            icon="x"
            onClick={onHide}
        />
    ) : null;

    const titleDOM =
        title !== null && closeButton ? (
            <div className="Modal-title">{title}</div>
        ) : null;

    return (
        <div className={modalClassName}>
            {titleDOM}
            {closeButton}
            <div className="Modal-content">{children}</div>
        </div>
    );
};
