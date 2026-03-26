import { addRunInputSnapshot } from 'hooks/queryEditor/useExecutionSnapshots';

describe('addRunInputSnapshot', () => {
    test('adds a snapshot to an empty record', () => {
        const result = addRunInputSnapshot({}, 1, 'SELECT 1');
        expect(result).toEqual({ 1: 'SELECT 1' });
    });

    test('adds a new execution to existing snapshots', () => {
        const prev = { 1: 'SELECT 1' };
        const result = addRunInputSnapshot(prev, 2, 'SELECT 2');
        expect(result).toEqual({ 1: 'SELECT 1', 2: 'SELECT 2' });
    });

    test('overwrites an existing execution snapshot', () => {
        const prev = { 1: 'SELECT old' };
        const result = addRunInputSnapshot(prev, 1, 'SELECT new');
        expect(result).toEqual({ 1: 'SELECT new' });
    });

    test('does not mutate the original record', () => {
        const prev = { 1: 'SELECT 1' };
        const result = addRunInputSnapshot(prev, 2, 'SELECT 2');
        expect(prev).toEqual({ 1: 'SELECT 1' });
        expect(result).not.toBe(prev);
    });

    test('handles many snapshots without pruning', () => {
        let record: Record<number, string> = {};
        for (let i = 0; i < 50; i++) {
            record = addRunInputSnapshot(record, i, `SELECT ${i}`);
        }
        expect(Object.keys(record)).toHaveLength(50);
        expect(record[0]).toBe('SELECT 0');
        expect(record[49]).toBe('SELECT 49');
    });
});
