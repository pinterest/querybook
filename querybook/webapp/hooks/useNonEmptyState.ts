import { useCallback, useState } from 'react';

/**
 * Use this when you need a state from the Gen AI streaming that fits the following desc:
 *
 * - The state may have a break between two consecutive streaming updates.
 *
 * e.g.
 * {"query": "SELECT\n Country"}
 * {"query": ""}                        // Here somehow the state is empty
 * {"query": "SELECT\n Country,\n"}
 * {"query": "SELECT\n Country,\n Rank"}
 *
 * We'd like to return the old value if the new value is empty.
 *
 * @param initVal
 */
export default function useNonEmptyState<T>(initValue: T | (() => T)) {
    const [state, _setState] = useState<T>(initValue);
    const setState = useCallback((newValOrFunc: T | ((old: T) => T)) => {
        _setState((oldVal) => {
            const newVal =
                typeof newValOrFunc === 'function'
                    ? (newValOrFunc as (old: T) => T)(oldVal)
                    : newValOrFunc;
            return newVal || oldVal;
        });
    }, []);
    return [state, setState] as const;
}
