import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

import './index.scss';

const Overlay = ({ children, render }) => {
    const overlayRoot = useMemo(() => {
        let overlayRoot = document.getElementById('overlay-root');
        if (!overlayRoot) {
            overlayRoot = document.createElement('div');
            overlayRoot.id = 'overlay-root';
            document.body.appendChild(overlayRoot);
        }
        return overlayRoot;
    }, []);

    const overlayRef = useRef(document.createElement('div'));
    useEffect(() => {
        if (overlayRoot) {
            overlayRoot.appendChild(overlayRef.current);
            return () => {
                overlayRoot.removeChild(overlayRef.current);
            };
        }
    }, [overlayRoot]);

    const content = render ? render(overlayRef.current) : children;
    return ReactDOM.createPortal(content, overlayRef.current);
};

const ImageModal = ({ children, onDismiss }) => {
    useEffect(() => {
        const overlayRoot = document.getElementById('overlay-root');
        disableBodyScroll(overlayRoot);
        return () => {
            enableBodyScroll(overlayRoot);
        };
    }, []);
    return (
        <Overlay>
            <div className="ImageModal" onClick={onDismiss}>
                <div className="Modal-image">{children}</div>
            </div>
        </Overlay>
    );
};

export default ({ children, className = '' }) => {
    const [showModal, setShowModal] = useState(false);

    let modalDOM = showModal ? (
        <ImageModal onDismiss={() => setShowModal(false)}>
            {children}
        </ImageModal>
    ) : null;

    return (
        <>
            <span
                onClick={() => setShowModal(true)}
                className={'ImageModalButton ' + className}
            >
                {children}
            </span>
            {modalDOM}
        </>
    );
};
