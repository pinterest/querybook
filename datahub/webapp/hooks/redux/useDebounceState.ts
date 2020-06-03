// Copied from https://dev.to/gabe_ragland/debouncing-with-react-hooks-jci

import { useState, useEffect, useMemo, useRef } from 'react';
import { debounce, throttle } from 'lodash';

interface IUseDebounceStateOptions {
    // defaults to debounce
    method: 'debounce' | 'throttle';
}

export function useDebounceState<T>(
    value: T,
    setValue: (v: T) => any,
    delay: number,
    options?: IUseDebounceStateOptions
): [T, (v: T) => any] {
    // State and setters for debounced value
    const [cachedValue, setCachedValue] = useState(value);
    const lastValueUpdatedRef = useRef(value);
    const setValueDebounced = useMemo(() => {
        const delayMethod =
            options?.method === 'throttle' ? throttle : debounce;

        return delayMethod((newValue: T) => {
            lastValueUpdatedRef.current = newValue;
            setValue(newValue);
        }, delay);
    }, [delay, options?.method, setValue]);

    useEffect(() => {
        if (value !== lastValueUpdatedRef.current) {
            lastValueUpdatedRef.current = value;
            setCachedValue(value);
        }
    }, [value]);

    useEffect(() => {
        if (cachedValue !== value) {
            setValueDebounced(cachedValue);
        }
    }, [cachedValue]);

    return [cachedValue, setCachedValue];
}
