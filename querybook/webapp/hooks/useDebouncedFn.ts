import { useMemo } from 'react';
import { debounce } from 'lodash';

export function useDebouncedFn<F extends (...args: any) => any>(
    fn: F,
    timeout: number,
    deps: any[]
) {
    return useMemo(() => debounce(fn, timeout), deps);
}
