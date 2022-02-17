import React from 'react';

import { matchKeyMap, KeyMap } from 'lib/utils/keyboard';
import { useEvent } from 'hooks/useEvent';

import { IModalProps } from './types';
import { FullScreenModal } from './FullScreenModal';
import { StandardModal } from './StandardModal';

import { Overlay } from 'ui/Overlay/Overlay';

import './Modal.scss';

export const Modal: React.FunctionComponent<IModalProps> = ({
    type = 'standard',
    className = '',
    children,
    onHide,
    title,
    infoDOM,
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
        modalDOM = children;
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
                infoDOM={infoDOM}
                topDOM={topDOM}
                bottomDOM={bottomDOM}
            >
                {children}
            </StandardModal>
        );
    }

    return <Overlay className="Modal">{modalDOM}</Overlay>;
};
