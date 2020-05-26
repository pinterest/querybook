import React, { useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';

type OverlayRender = (overlayElm: HTMLDivElement) => any;

interface IOverlayProps {
    className?: string;
    render?: OverlayRender;
    root?: HTMLElement;
}

export const defaultOverlayRoot = document.getElementById('overlay-root');

export const Overlay: React.FC<IOverlayProps> = ({
    children,
    className = '',
    render,
    root,
}) => {
    const overlayRoot = useMemo(() => root ?? defaultOverlayRoot, [root]);
    const overlayRef = useRef(document.createElement('div'));
    useEffect(() => {
        if (className) {
            overlayRef.current.className = className;
        }

        overlayRoot.appendChild(overlayRef.current);
        return () => {
            overlayRoot.removeChild(overlayRef.current);
        };
    }, [overlayRoot]);

    const content = render ? render(overlayRef.current) : children;
    return ReactDOM.createPortal(content, overlayRef.current);
};
