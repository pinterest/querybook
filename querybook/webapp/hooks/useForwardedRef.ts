// https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd
import React, { useEffect, useRef } from 'react';

export function useForwardedRef<T>(ref: React.Ref<T>) {
    const targetRef = useRef<T>(null);

    // note: this runs once per render
    useEffect(() => {
        if (!ref) {
            return;
        }
        if (typeof ref === 'function') {
            ref(targetRef.current);
        } else {
            (ref as React.MutableRefObject<T>).current = targetRef.current;
        }
    });

    return targetRef;
}
