import { useCallback, useState } from 'react';

export function addRunInputSnapshot(
    prev: Record<number, string>,
    executionId: number,
    runInput: string
): Record<number, string> {
    return { ...prev, [executionId]: runInput };
}

export function useExecutionSnapshots() {
    const [snapshots, setSnapshots] = useState<Record<number, string>>({});

    const recordSnapshot = useCallback(
        (executionId: number, runInput: string) => {
            setSnapshots((prev) =>
                addRunInputSnapshot(prev, executionId, runInput)
            );
        },
        []
    );

    return { snapshots, recordSnapshot };
}
