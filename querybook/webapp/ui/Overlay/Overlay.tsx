import React, { useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';

type OverlayRender = (overlayElm: HTMLDivElement) => any;

interface IOverlayProps {
    className?: string;
    render?: OverlayRender;
    customOverlayRoot?: HTMLElement;
}

export const overlayRoot = (() => {
    let root = document.getElementById('overlay-root');
    if (!root) {
        root = document.createElement('div');
        document.body.appendChild(root);
    }
    return root;
})();

export const Overlay: React.FC<IOverlayProps> = ({
    children,
    className = '',
    render,
    customOverlayRoot,
}) => {
    const actualOverlayRoot = useMemo(() => customOverlayRoot ?? overlayRoot, [
        customOverlayRoot,
    ]);
    const overlayRef = useRef(document.createElement('div'));
    useEffect(() => {
        if (className) {
            overlayRef.current.className = className;
        }

        actualOverlayRoot.appendChild(overlayRef.current);
        return () => {
            actualOverlayRoot.removeChild(overlayRef.current);
        };
    }, [actualOverlayRoot]);

    const content = render ? render(overlayRef.current) : children;
    return ReactDOM.createPortal(content, overlayRef.current);
};
