import { useDebounce } from 'hooks/useDebounce';

const DEFAULT_DEBOUNCE_MS = 300;

export function shouldComputeStaleWarning(
    selectedExecutionId: number | null | undefined,
    snapshots: Readonly<Record<number, string>>,
    currentInput: string,
    initialQuery?: string
): boolean {
    if (selectedExecutionId == null) {
        return false;
    }

    const snapshot = snapshots[selectedExecutionId] ?? initialQuery;
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
}): { showWarning: boolean } {
    const {
        selectedExecutionId,
        snapshots,
        currentRunInput,
        initialQuery,
        debounceMs = DEFAULT_DEBOUNCE_MS
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

    return {
        showWarning: isStaleDebounced && isStaleRealtime,
    };
}
