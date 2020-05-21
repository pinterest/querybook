import React from 'react';

import { matchKeyPress } from 'lib/utils/keyboard';
import { useWindowEvent } from 'hooks/useWindowEvent';

import { IModalProps } from './types';
import { FullScreenModal } from './FullScreenModal';
import { StandardModal } from './StandardModal';
import './Modal.scss';
import { Overlay } from 'ui/Overlay/Overlay';

// const modalRoot = document.getElementById('modal-root');

export const Modal: React.FunctionComponent<IModalProps> = ({
    type = 'standard',
    hideClose = false,
    className = '',
    children,
    onHide,
    modalRoot,
    title,
}) => {
    const onEscapeKeyDown = React.useCallback(
        (evt) => {
            if (matchKeyPress(evt, 'ESC') && onHide) {
                onHide();
            }
        },
        [onHide]
    );
    useWindowEvent('keydown', onEscapeKeyDown);

    let modalDOM: React.ReactNode;
    if (type === 'custom') {
        modalDOM = children;
    } else if (type === 'fullscreen') {
        modalDOM = (
            <FullScreenModal
                onHide={onHide}
                hideClose={hideClose}
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
                hideClose={hideClose}
                className={className}
                title={title}
            >
                {children}
            </StandardModal>
        );
    }

    return <Overlay className="Modal">{modalDOM}</Overlay>;
};
