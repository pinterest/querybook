import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function findFirstDuplicatedIdx<T extends string | number>(arr: T[]): number {
    const valueToIdx = {} as Record<T, number>;
    for (const [i, value] of arr.entries()) {
        if (value in valueToIdx) {
            return valueToIdx[value];
        }
        valueToIdx[value] = i;
    }
    return -1;
}

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

        const firstDupIdx = findFirstDuplicatedIdx(pathnames);
        return firstDupIdx < 0 ? pathnames : pathnames.slice(firstDupIdx + 1);
    }, [location]);

    return path;
}
