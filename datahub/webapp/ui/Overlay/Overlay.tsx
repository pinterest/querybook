import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

type OverlayRender = (overlayElm: HTMLDivElement) => any;

interface IOverlayProps {
    className?: string;
    render?: OverlayRender;
}

export const overlayRoot = document.getElementById('overlay-root');

export const Overlay: React.FC<IOverlayProps> = ({
    children,
    className = '',
    render,
}) => {
    const overlayRef = useRef(document.createElement('div'));
    useEffect(() => {
        if (className) {
            overlayRef.current.className = className;
        }

        overlayRoot.appendChild(overlayRef.current);
        return () => {
            overlayRoot.removeChild(overlayRef.current);
        };
    }, []);

    const content = render ? render(overlayRef.current) : children;
    return ReactDOM.createPortal(content, overlayRef.current);
};
