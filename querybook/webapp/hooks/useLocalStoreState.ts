import localStore from 'lib/local-store';
import { Nullable } from 'lib/typescript';
import { isFunction } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

export function useLocalStoreState<T>({
    storeKey,
    defaultValue,
}: {
    storeKey: string;
    defaultValue: Nullable<T | (() => T)>;
}) {
    const [state, setState] = useState<T>(defaultValue);

    useEffect(() => {
        localStore.get<T>(storeKey).then((storedVal) => {
            if (storedVal != null) {
                // if the val is retrieved
                setState(storedVal);
            }
        });
    }, [storeKey]);

    const syncedSetState = useCallback(
        (newValOrFunc: T | ((old: T) => T)) => {
            setState((oldVal) => {
                const newVal = isFunction(newValOrFunc)
                    ? newValOrFunc(oldVal)
                    : newValOrFunc;
                localStore.set(storeKey, newVal);
                return newVal;
            });
        },
        [storeKey]
    );

    return [state, syncedSetState] as const;
}
