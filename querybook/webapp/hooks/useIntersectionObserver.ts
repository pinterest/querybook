import { useCallback, useEffect, useRef } from 'react';

export function useIntersectionObserver({
    intersectElement,
    onIntersect,
    deps,
    disabled,
}: {
    intersectElement: HTMLElement;
    onIntersect: () => void;
    deps: any[];
    disabled: boolean;
}) {
    const interseptor = useRef<IntersectionObserver>(null);
    const rootElement = intersectElement?.parentElement;

    const intersectCallback = useCallback(() => {
        interseptor.current.unobserve(intersectElement);
        onIntersect();
    }, [intersectElement]);

    useEffect(() => {
        let observer: IntersectionObserver = null;
        if (rootElement) {
            observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        intersectCallback();
                    }
                },
                {
                    root: rootElement,
                }
            );
        }
        interseptor.current = observer;

        return () => {
            if (observer) {
                interseptor.current.disconnect();
            }
        };
    }, [rootElement]);

    useEffect(() => {
        if (!disabled && intersectElement) {
            interseptor.current.observe(intersectElement);
        }
    }, [...deps, intersectElement]);
}
