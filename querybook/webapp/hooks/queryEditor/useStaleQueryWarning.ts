import { useCallback } from 'react';

import { useDebounce } from 'hooks/useDebounce';

const DEFAULT_DEBOUNCE_MS = 300;

export function getSnapshotForExecution(
    executionId: number | null | undefined,
    snapshots: Readonly<Record<number, string>>,
    initialQuery?: string
): string | undefined {
    if (executionId == null) {
        return undefined;
    }
    return snapshots[executionId] ?? initialQuery;
}

export function shouldComputeStaleWarning(
    selectedExecutionId: number | null | undefined,
    snapshots: Readonly<Record<number, string>>,
    currentInput: string,
    initialQuery?: string
): boolean {
    const snapshot = getSnapshotForExecution(
        selectedExecutionId,
        snapshots,
        initialQuery
    );
    if (snapshot === undefined) {
        return false;
    }
    return currentInput !== snapshot;
}

export function useStaleQueryWarning(options: {
    selectedExecutionId: number | null | undefined;
    snapshots: Readonly<Record<number, string>>;
    currentRunInput: string;
    initialQuery?: string;
    debounceMs?: number;
    onUpdateQuery?: (query: string, run?: boolean) => any;
}): { showWarning: boolean; snapshotQuery: string | undefined; onRevert?: () => void } {
    const {
        selectedExecutionId,
        snapshots,
        currentRunInput,
        initialQuery,
        debounceMs = DEFAULT_DEBOUNCE_MS,
        onUpdateQuery,
    } = options;

    const debouncedInput = useDebounce(currentRunInput, debounceMs);

    // Debounced check stays stable during typing to prevent flickering.
    // Real-time check instantly suppresses false positives on initial page load
    // (when currentRunInput briefly differs from the snapshot before the editor populates).
    const isStaleDebounced = shouldComputeStaleWarning(
        selectedExecutionId,
        snapshots,
        debouncedInput,
        initialQuery
    );
    const isStaleRealtime = shouldComputeStaleWarning(
        selectedExecutionId,
        snapshots,
        currentRunInput,
        initialQuery
    );

    const snapshotQuery = getSnapshotForExecution(
        selectedExecutionId,
        snapshots,
        initialQuery
    );

    const onRevert = useCallback(() => {
        if (snapshotQuery !== undefined) {
            onUpdateQuery?.(snapshotQuery);
        }
    }, [snapshotQuery, onUpdateQuery]);

    return {
        showWarning: isStaleDebounced && isStaleRealtime,
        snapshotQuery,
        onRevert: onUpdateQuery ? onRevert : undefined,
    };
}
