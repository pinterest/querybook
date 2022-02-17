import clsx from 'clsx';
import React from 'react';

import { useMounted } from 'hooks/useMounted';
import { IStandardModalProps } from './types';
import { useDebounce } from 'hooks/useDebounce';
import { useAppBlur } from 'hooks/ui/useAppBlur';

export const StandardModal: React.FunctionComponent<IStandardModalProps> = ({
    className = '',
    children,
    onHide,
    title = '',
    infoDOM = null,
    topDOM = null,
    bottomDOM = null,
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

    const modalTopDOM =
        title != null ? (
            <div className="Modal-top">
                {title ? (
                    <div className="horizontal-space-between">
                        <div className="Modal-title">{title}</div>
                        {infoDOM}
                    </div>
                ) : null}
                {topDOM}
            </div>
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
