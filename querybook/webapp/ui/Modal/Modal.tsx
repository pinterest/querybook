import React from 'react';

import { useEvent } from 'hooks/useEvent';
import { KeyMap, matchKeyMap } from 'lib/utils/keyboard';
import { Overlay } from 'ui/Overlay/Overlay';

import { FullScreenModal } from './FullScreenModal';
import { StandardModal } from './StandardModal';
import { IModalProps } from './types';

import './Modal.scss';

export const Modal: React.FunctionComponent<IModalProps> = ({
    type = 'standard',
    className = '',
    children,
    onHide,
    title,
    topDOM,
    bottomDOM,
}) => {
    const onEscapeKeyDown = React.useCallback(
        (evt) => {
            if (matchKeyMap(evt, KeyMap.overallUI.closeModal) && onHide) {
                onHide();
            }
        },
        [onHide]
    );
    useEvent('keydown', onEscapeKeyDown);

    let modalDOM: React.ReactNode;
    if (type === 'custom') {
        modalDOM = (
            <div className={'CustomModal ' + className}>
                <div className="Modal-background fullscreen" onClick={onHide} />
                {children}
            </div>
        );
    } else if (type === 'fullscreen') {
        modalDOM = (
            <FullScreenModal
                onHide={onHide}
                className={className}
                title={title}
            >
                {children}
            </FullScreenModal>
        );
    } else {
        // standard
        modalDOM = (
            <StandardModal
                onHide={onHide}
                className={className}
                title={title}
                topDOM={topDOM}
                bottomDOM={bottomDOM}
            >
                {children}
            </StandardModal>
        );
    }

    return <Overlay className="Modal">{modalDOM}</Overlay>;
};
