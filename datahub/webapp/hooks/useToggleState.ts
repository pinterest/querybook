import React, { useCallback, useState } from 'react';

/**
 * Create a toggle function for a boolean useState setter
 *
 * @param setter the setter function provided by useState
 * @param deps the dependency array if the setter would be recreated during rerender
 *
 */
export const useToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    deps: any[] = []
) => useCallback(() => setter((v) => !v), deps);

/**
 * Create a boolean state in FC that can be toggled
 *
 * @param initialValue the initializer for this state, same as in useState
 */
export const useToggleState = (initialValue: boolean | (() => boolean)) => {
    const [state, setState] = useState(initialValue);
    const toggleState = useToggle(setState);

    return [state, setState, toggleState] as const;
};
