import React, { useCallback } from 'react';

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
