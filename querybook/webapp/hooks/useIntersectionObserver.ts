import { useEffect, useRef, useCallback } from 'react';

export function useIntersectionObserver({
    rootElement,
    intersectElement,
    onIntersect,
    listData,
}: {
    rootElement: HTMLElement;
    intersectElement: HTMLElement;
    onIntersect: () => void;
    listData: any;
}) {
    const interseptor = useRef<IntersectionObserver>(null);

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
        if (!listData.done && intersectElement) {
            interseptor.current.observe(intersectElement);
        }
    }, [listData, intersectElement]);
}
