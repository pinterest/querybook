import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const duplicateIdx = (array) => {
    const valueSet = new Set([]);
    for (let i = 0; i < array.length; ++i) {
        const value = array[i];
        if (valueSet.has(value)) {
            return i;
        }
        valueSet.add(value);
    }
    return null;
};

/**
 * Extract the recursive board ids
 *
 * @returns string[] list of boardIds
 */
export function useBoardPath() {
    const location = useLocation();
    // Ignore the first two parts which is environment name and list

    const path = useMemo(() => {
        const pathnames = (location.pathname as string)
            .split('/')
            .filter((p) => p)
            .slice(2)
            .map(Number);

        const dupIdx = duplicateIdx(pathnames);

        return dupIdx === null ? pathnames : pathnames.slice(dupIdx);
    }, [location]);

    return path;
}
