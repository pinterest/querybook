import { useEffect, useRef, useCallback } from 'react';

export function useIntersectionObserver({
    intersectElement,
    onIntersect,
    deps,
    enabled,
}: {
    intersectElement: HTMLElement;
    onIntersect: () => void;
    deps: any[];
    enabled: boolean;
}) {
    const interseptor = useRef<IntersectionObserver>(null);
    const rootElement = intersectElement?.parentElement;

    const intersectCallback = useCallback(() => {
        interseptor.current.unobserve(intersectElement);
        onIntersect();
    }, [intersectElement]);

    useEffect(() => {
        interseptor.current = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    intersectCallback();
                }
            },
            {
                root: rootElement,
            }
        );

        return () => {
            interseptor.current.disconnect();
        };
    }, [rootElement]);

    useEffect(() => {
        if (!enabled && intersectElement) {
            interseptor.current.observe(intersectElement);
        }
    }, [...deps, intersectElement]);
}
