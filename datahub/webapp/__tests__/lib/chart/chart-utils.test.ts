import { sortTable } from 'lib/chart/chart-utils';

const testData = [
    ['time', 'type1', 'type2', 'type3', 'val', 'null'],
    ['2001-01-02', 4, 9, 100, null, null],
    ['2001-01-03', 2, 10, 100, '1.2', 'null'],
    ['2001-01-02', 3, 10, 100, '50.0', 'null'],
    ['2001-01-03', 4, 10, 100, 'null', null],
    ['2001-01-01', 5, 10, 100, '-9.0', 'null'],
    ['2001-01-01', 6, 11, 1, '0.9', null],
];

test('data sorts by first column (date)', () => {
    const transformedData = sortTable(testData.slice(1), 0);
    expect(transformedData[0][0]).toBe('2001-01-01');
    expect(transformedData[1][0]).toBe('2001-01-01');
    expect(transformedData[5][0]).toBe('2001-01-03');
});

test('data sorts by second column (type 1)', () => {
    const transformedData = sortTable(testData.slice(1), 1);
    expect(transformedData[0][0]).toBe('2001-01-03');
    expect(transformedData[1][0]).toBe('2001-01-02');
    expect(transformedData[5][0]).toBe('2001-01-01');
});

test('data sorts with null values', () => {
    const transformedData = sortTable(testData.slice(1), 4);
    expect(transformedData).toEqual([
        ['2001-01-01', 5, 10, 100, '-9.0', 'null'],
        ['2001-01-01', 6, 11, 1, '0.9', null],
        ['2001-01-03', 2, 10, 100, '1.2', 'null'],
        ['2001-01-02', 3, 10, 100, '50.0', 'null'],
        ['2001-01-02', 4, 9, 100, null, null],
        ['2001-01-03', 4, 10, 100, 'null', null],
    ]);
});

test('data does not sort columns with only null values', () => {
    const transformedData = sortTable(testData.slice(1), 5);
    expect(transformedData).toEqual([
        ['2001-01-02', 4, 9, 100, null, null],
        ['2001-01-03', 2, 10, 100, '1.2', 'null'],
        ['2001-01-02', 3, 10, 100, '50.0', 'null'],
        ['2001-01-03', 4, 10, 100, 'null', null],
        ['2001-01-01', 5, 10, 100, '-9.0', 'null'],
        ['2001-01-01', 6, 11, 1, '0.9', null],
    ]);
});
