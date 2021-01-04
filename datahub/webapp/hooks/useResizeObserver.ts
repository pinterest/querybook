import { useEffect } from 'react';

export function useResizeObserver(
    element: HTMLElement,
    onResize: (entries: ResizeObserverEntry[]) => void,
    onResizeStart?: () => void
) {
    useEffect(() => {
        let observer: ResizeObserver | undefined;

        if (element) {
            onResizeStart?.();
            observer = new ResizeObserver(onResize);
            observer.observe(element);
        }

        return () => {
            if (observer) {
                observer.disconnect();
            }
        };
    }, [element, onResize, onResizeStart]);
}
