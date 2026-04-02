import { useDebounce } from 'hooks/useDebounce';

const DEFAULT_DEBOUNCE_MS = 300;

export type StaleWarningState = 'edited' | 'unsaved' | null;

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

export function computeStaleWarningState(options: {
    selectedExecutionId: number | null | undefined;
    snapshots: Readonly<Record<number, string>>;
    savedInput: string;
    liveInput: string;
    initialQuery?: string;
    isSaving?: boolean;
}): StaleWarningState {
    const {
        selectedExecutionId,
        snapshots,
        savedInput,
        liveInput,
        initialQuery,
        isSaving = false,
    } = options;

    const isLiveStale = shouldComputeStaleWarning(
        selectedExecutionId,
        snapshots,
        liveInput,
        initialQuery
    );

    if (!isLiveStale) {
        return null;
    }

    const isSavedStale = shouldComputeStaleWarning(
        selectedExecutionId,
        snapshots,
        savedInput,
        initialQuery
    );

    if (isSavedStale && !isSaving) {
        return 'edited';
    }

    return 'unsaved';
}

export function useStaleQueryWarning(options: {
    selectedExecutionId: number | null | undefined;
    snapshots: Readonly<Record<number, string>>;
    savedRunInput: string;
    liveRunInput: string;
    initialQuery?: string;
    debounceMs?: number;
    isSaving?: boolean;
}): { warningState: StaleWarningState } {
    const {
        selectedExecutionId,
        snapshots,
        savedRunInput,
        liveRunInput,
        initialQuery,
        debounceMs = DEFAULT_DEBOUNCE_MS,
        isSaving = false,
    } = options;

    const debouncedLiveInput = useDebounce(liveRunInput, debounceMs);

    // Debounced check stays stable during typing to prevent flickering.
    // Real-time check instantly suppresses false positives on initial page load
    // (when liveRunInput briefly differs from the snapshot before the editor populates).
    const debouncedState = computeStaleWarningState({
        selectedExecutionId,
        snapshots,
        savedInput: savedRunInput,
        liveInput: debouncedLiveInput,
        initialQuery,
        isSaving,
    });
    const realtimeState = computeStaleWarningState({
        selectedExecutionId,
        snapshots,
        savedInput: savedRunInput,
        liveInput: liveRunInput,
        initialQuery,
        isSaving,
    });

    // Both must agree on a non-null state; if either is null, suppress.
    const warningState =
        debouncedState !== null && realtimeState !== null
            ? debouncedState
            : null;

    return { warningState };
}
