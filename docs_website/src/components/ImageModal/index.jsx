import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

import './index.scss';

function getPageContentDOM() {
    return document.getElementById('__docusaurus');
}

function blurPage() {
    const contentDOM = getPageContentDOM();
    contentDOM.classList.add('blur-page');
}

function unblurPage() {
    const contentDOM = getPageContentDOM();
    contentDOM.classList.remove('blur-page');
}

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
            blurPage();

            return () => {
                overlayRoot.removeChild(overlayRef.current);
                if (overlayRoot.childElementCount === 0) {
                    unblurPage();
                }
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

const MagnifyIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="image-magnify-icon"
    >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

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
                <MagnifyIcon />
            </span>
            {modalDOM}
        </>
    );
};
