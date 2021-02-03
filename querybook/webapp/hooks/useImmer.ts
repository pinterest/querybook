import produce from 'immer';
import { useCallback, useState } from 'react';

export type SetStateImmer<S> = (f: (draft: S) => void) => void;
export function useImmer<S>(
    initialValue: S | (() => S)
): [S, SetStateImmer<S>] {
    const [state, setState] = useState(initialValue);

    return [
        state,
        useCallback((updater) => {
            setState((prevState) => produce(prevState, updater));
        }, []),
    ];
}
