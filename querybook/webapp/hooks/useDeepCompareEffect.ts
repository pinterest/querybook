import { isEqual } from 'lodash';
import { useEffect, useRef } from 'react';

export default function useDeepCompareEffect(callback, dependencies) {
    const currentDependenciesRef = useRef();

    if (!isEqual(currentDependenciesRef.current, dependencies)) {
        currentDependenciesRef.current = dependencies;
    }

    useEffect(callback, [currentDependenciesRef.current]);
}
