import { useCallback } from 'react';

export function useBoundFunc<F extends (...args: any) => any>(
    func: F,
    ...args: Parameters<F>
): () => ReturnType<F> {
    return useCallback(() => func(...(args as any)), [func, ...args]);
}
