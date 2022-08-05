import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Extract the recursive board ids
 *
 * @returns string[] list of boardIds
 */
export function useBoardPath() {
    const location = useLocation();
    // Ignore the first two parts which is environment name and list

    const path = useMemo(
        () =>
            (location.pathname as string)
                .split('/')
                .filter((p) => p)
                .slice(2)
                .map(Number),
        [location]
    );

    return path;
}
