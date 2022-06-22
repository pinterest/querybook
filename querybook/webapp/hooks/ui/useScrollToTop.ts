import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { getScrollParent, smoothScroll } from 'lib/utils';

export const useScrollToTop = ({
    containerRef,
}: {
    containerRef: React.RefObject<HTMLElement>;
}) => {
    const [showScrollToTop, setShowScrollToTop] = useState(false);

    const checkParentScroll = useCallback(
        debounce((scrollTop: number) => {
            setShowScrollToTop(scrollTop > 230);
        }, 500),
        []
    );

    useEffect(() => {
        const scrollParent = getScrollParent(containerRef?.current);
        const scrollFunction = (e) => checkParentScroll(e.target.scrollTop);
        if (scrollParent) {
            scrollParent.addEventListener('scroll', scrollFunction);
        }

        return () => {
            if (scrollParent && scrollFunction) {
                scrollParent.removeEventListener('scroll', scrollFunction);
            }
        };
    }, []);

    const scrollToTop = useCallback(() => {
        const scrollParent = getScrollParent(containerRef?.current);
        if (scrollParent) {
            smoothScroll(scrollParent, 0, 200);
        }
    }, [containerRef]);

    return { showScrollToTop, scrollToTop };
};
