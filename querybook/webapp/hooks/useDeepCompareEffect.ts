import { isEqual } from 'lodash';
import { DependencyList, EffectCallback, useEffect, useRef } from 'react';

export default function useDeepCompareEffect(
    callback: EffectCallback,
    deps?: DependencyList
) {
    const currentDependenciesRef = useRef<DependencyList>();

    if (!isEqual(currentDependenciesRef.current, deps)) {
        currentDependenciesRef.current = deps;
    }

    useEffect(callback, [currentDependenciesRef.current]);
}
