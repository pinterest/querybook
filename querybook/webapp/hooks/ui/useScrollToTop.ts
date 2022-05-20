import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { getScrollParent, smoothScroll } from 'lib/utils';

export const useScrollToTop = ({
    selfRef,
}: {
    selfRef: React.RefObject<any>;
}) => {
    const [showScrollToTop, setShowScrollToTop] = useState(false);

    const checkParentScroll = useCallback(
        debounce((scrollTop: number) => {
            setShowScrollToTop(scrollTop > 230);
        }, 500),
        []
    );

    useEffect(() => {
        const scrollParent = getScrollParent(selfRef?.current);
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

    const onScrollClick = useCallback(() => {
        const scrollParent = getScrollParent(selfRef?.current);
        if (scrollParent) {
            smoothScroll(scrollParent, 0, 200);
        }
    }, [selfRef]);

    return { showScrollToTop, onScrollClick };
};
