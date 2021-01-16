// https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd

import React, { useRef, useEffect } from 'react';

export function useForwardedRef<T>(ref: React.Ref<T>) {
    const targetRef = useRef<T>(null);
    useEffect(() => {
        if (!ref) {
            return;
        }
        if (typeof ref === 'function') {
            ref(targetRef.current);
        } else {
            (ref as React.MutableRefObject<T>).current = targetRef.current;
        }
    }, [ref]);

    return targetRef;
}
