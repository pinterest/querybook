import clsx from 'clsx';
import React from 'react';

import { useMounted } from 'hooks/useMounted';
import { IconButton } from 'ui/Button/IconButton';
import { IStandardModalProps } from './types';
import { useDebounce } from 'hooks/useDebounce';
import { useAppBlur } from 'hooks/ui/useAppBlur';

export const StandardModal: React.FunctionComponent<IStandardModalProps> = ({
    hideClose = false,
    className = '',
    children,
    onHide,
    title = '',
}) => {
    useAppBlur();
    const mounted = useMounted();
    const active = useDebounce(mounted, 100); // delay the mount by 100

    const modalClassName = clsx({
        StandardModal: true,
        fullscreen: true,
        'is-active': active,
        [className]: Boolean(className),
    });

    const closeButton = hideClose ? null : (
        <IconButton
            className="Modal-close"
            aria-label="close"
            icon="x"
            onClick={onHide}
        />
    );

    const titleDOM =
        title !== null && closeButton ? (
            <div className="Modal-title">{title}</div>
        ) : null;

    return (
        <div className={modalClassName}>
            <div
                className="Modal-background fullscreen"
                onClick={hideClose ? null : onHide}
            />
            <div className="Modal-box">
                {titleDOM}
                <div className="Modal-content">{children}</div>
                {closeButton}
            </div>
        </div>
    );
};
