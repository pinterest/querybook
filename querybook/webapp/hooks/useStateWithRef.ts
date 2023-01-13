import { useCallback, useRef, useState } from 'react';

/**
 * Use this when you need a state that fits the following desc:
 *
 * - The state may get updated frequently
 * - The state is referenced in an useEffect that's costly to setup
 *
 * Since the useEffect is costly to setup, you can reference the
 * state value via ref.current so the useEffect isn't repeatedly
 * updated.
 *
 * @param initialVal
 */
export function useStateWithRef<T>(initialVal: T | (() => T)) {
    const [state, _setState] = useState<T>(initialVal);
    const ref = useRef(state);

    const setState = useCallback((newState: T | ((old: T) => T)) => {
        _setState((old) => {
            const newVal =
                typeof newState === 'function'
                    ? (newState as (old: T) => T)(old)
                    : newState;
            ref.current = newVal;
            return newVal;
        });
    }, []);

    return [state, setState, ref] as const;
}
