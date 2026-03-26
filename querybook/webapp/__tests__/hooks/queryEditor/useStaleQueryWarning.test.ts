import { shouldComputeStaleWarning } from 'hooks/queryEditor/useStaleQueryWarning';

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
        expect(
            shouldComputeStaleWarning(1, {}, 'changed', 'original')
        ).toBe(true);
    });
});
