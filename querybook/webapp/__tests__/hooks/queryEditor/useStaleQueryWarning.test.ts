import {
    shouldComputeStaleWarning,
    computeStaleWarningState,
} from 'hooks/queryEditor/useStaleQueryWarning';

describe('shouldComputeStaleWarning', () => {
    const snapshots: Record<number, string> = {
        1: 'SELECT * FROM t1',
        2: 'SELECT * FROM t2',
    };

    test('returns false when selectedExecutionId is null', () => {
        expect(
            shouldComputeStaleWarning(null, snapshots, 'SELECT * FROM t1')
        ).toBe(false);
    });

    test('returns false when selectedExecutionId is undefined', () => {
        expect(
            shouldComputeStaleWarning(undefined, snapshots, 'SELECT * FROM t1')
        ).toBe(false);
    });

    test('returns false when snapshot matches current input', () => {
        expect(
            shouldComputeStaleWarning(1, snapshots, 'SELECT * FROM t1')
        ).toBe(false);
    });

    test('returns true when snapshot differs from current input', () => {
        expect(
            shouldComputeStaleWarning(1, snapshots, 'SELECT * FROM changed')
        ).toBe(true);
    });

    test('returns false when execution has no snapshot and no initialQuery', () => {
        expect(
            shouldComputeStaleWarning(99, snapshots, 'SELECT * FROM t1')
        ).toBe(false);
    });

    describe('initialQuery fallback', () => {
        const initialQuery = 'SELECT 1';

        test('uses initialQuery when no snapshot exists for the execution', () => {
            expect(
                shouldComputeStaleWarning(
                    99,
                    snapshots,
                    'SELECT 2',
                    initialQuery
                )
            ).toBe(true);
        });

        test('returns false when current input matches initialQuery (no snapshot)', () => {
            expect(
                shouldComputeStaleWarning(
                    99,
                    snapshots,
                    'SELECT 1',
                    initialQuery
                )
            ).toBe(false);
        });

        test('prefers in-memory snapshot over initialQuery', () => {
            expect(
                shouldComputeStaleWarning(
                    1,
                    snapshots,
                    'SELECT * FROM t1',
                    'something else'
                )
            ).toBe(false);
        });

        test('warns when input differs from snapshot even if initialQuery matches', () => {
            expect(
                shouldComputeStaleWarning(
                    1,
                    snapshots,
                    'SELECT * FROM changed',
                    'SELECT * FROM changed'
                )
            ).toBe(true);
        });
    });

    test('works with empty snapshots and no initialQuery', () => {
        expect(shouldComputeStaleWarning(1, {}, 'any query')).toBe(false);
    });

    test('works with empty snapshots and initialQuery provided', () => {
        expect(shouldComputeStaleWarning(1, {}, 'changed', 'original')).toBe(
            true
        );
    });
});

describe('computeStaleWarningState', () => {
    const snapshots: Record<number, string> = {
        1: 'SELECT * FROM t1',
        2: 'SELECT * FROM t2',
    };

    const base = {
        selectedExecutionId: 1 as number | null,
        snapshots,
        initialQuery: undefined as string | undefined,
    };

    test('returns null when live input matches snapshot', () => {
        expect(
            computeStaleWarningState({
                ...base,
                savedInput: 'SELECT * FROM t1',
                liveInput: 'SELECT * FROM t1',
            })
        ).toBeNull();
    });

    test('returns null when no execution is selected', () => {
        expect(
            computeStaleWarningState({
                ...base,
                selectedExecutionId: null,
                savedInput: 'SELECT * FROM t1',
                liveInput: 'SELECT * FROM edited',
            })
        ).toBeNull();
    });

    test('returns "edited" when both live and saved differ from snapshot and not saving', () => {
        expect(
            computeStaleWarningState({
                ...base,
                savedInput: 'SELECT * FROM edited',
                liveInput: 'SELECT * FROM edited',
            })
        ).toBe('edited');
    });

    test('returns "unsaved" when live differs but saved still matches snapshot', () => {
        expect(
            computeStaleWarningState({
                ...base,
                savedInput: 'SELECT * FROM t1',
                liveInput: 'SELECT * FROM edited',
            })
        ).toBe('unsaved');
    });

    test('returns "unsaved" when both differ from snapshot but save is in-flight', () => {
        expect(
            computeStaleWarningState({
                ...base,
                savedInput: 'SELECT * FROM edited',
                liveInput: 'SELECT * FROM edited',
                isSaving: true,
            })
        ).toBe('unsaved');
    });

    test('returns "unsaved" when live differs and saved matches snapshot while saving', () => {
        expect(
            computeStaleWarningState({
                ...base,
                savedInput: 'SELECT * FROM t1',
                liveInput: 'SELECT * FROM edited',
                isSaving: true,
            })
        ).toBe('unsaved');
    });

    test('returns null when live matches snapshot even if saving', () => {
        expect(
            computeStaleWarningState({
                ...base,
                savedInput: 'SELECT * FROM t1',
                liveInput: 'SELECT * FROM t1',
                isSaving: true,
            })
        ).toBeNull();
    });

    test('uses initialQuery fallback when no snapshot exists', () => {
        expect(
            computeStaleWarningState({
                ...base,
                selectedExecutionId: 99,
                savedInput: 'SELECT 1',
                liveInput: 'SELECT 2',
                initialQuery: 'SELECT 1',
            })
        ).toBe('unsaved');
    });

    test('returns "edited" with initialQuery when both differ', () => {
        expect(
            computeStaleWarningState({
                ...base,
                selectedExecutionId: 99,
                savedInput: 'SELECT 2',
                liveInput: 'SELECT 2',
                initialQuery: 'SELECT 1',
            })
        ).toBe('edited');
    });
});
