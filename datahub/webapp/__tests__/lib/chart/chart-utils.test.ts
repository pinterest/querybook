import { sortTable } from 'lib/chart/chart-utils';

const testData = [
    ['time', 'type1', 'type2', 'type3'],
    ['2001-01-02', 4, 9, 100],
    ['2001-01-03', 2, 10, 100],
    ['2001-01-02', 3, 10, 100],
    ['2001-01-03', 4, 10, 100],
    ['2001-01-01', 5, 10, 100],
    ['2001-01-01', 6, 11, 1],
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
