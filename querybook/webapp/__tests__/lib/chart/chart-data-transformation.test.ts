import { transformData } from 'lib/chart/chart-data-transformation';

const testData = [
    ['time', 'type1', 'type2', 'type3'],
    ['2001-01-02', 4, 9, 100],
    ['2001-01-03', 2, 10, 100],
    ['2001-01-02', 3, 10, 100],
    ['2001-01-03', 4, 10, 100],
    ['2001-01-01', 5, 10, 100],
    ['2001-01-01', 6, 11, 1],
];

// invalid vals
const testData2 = [
    ['time', 'type1', 'type2', 'type3'],
    ['2001-01-02', 4, 9, 100],
    ['2001-01-03', null, 10, 100],
    ['2001-01-02', 3, 10, 'type1'],
    ['2001-01-03', 4, 10, 100],
    ['2001-01-01', 5, undefined, 100],
    ['2001-01-01', 6, 11, 1],
];

// categorical data
const testData3 = [
    ['time', 'val', 'color'],
    ['2001-01-01', 1, 'blue'],
    ['2001-01-01', 13, 'blue'],
    ['2001-01-01', 21, 'yellow'],
    ['2001-01-01', 74, 'pink'],

    ['2001-01-02', -1, 'blue'],
    ['2001-01-02', 3, 'pink'],
    ['2001-01-02', 31, 'blue'],
    ['2001-01-02', 99, 'pink'],

    ['2001-01-03', 3, 'yellow'],
    ['2001-01-03', 37, 'blue'],
    ['2001-01-03', 72, 'pink'],
    ['2001-01-03', 91, 'yellow'],
];

// AGG BY ALL ROWS
test('data aggregates by all rows (sum)', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        undefined,
        undefined,
        undefined,
        {}
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['sum', 24, 60, 501],
    ]);
});

test('data aggregates with value', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        undefined,
        undefined,
        [1],
        {}
    );
    expect(transformedData).toEqual([
        ['', 'type1'],
        ['sum of type1', 24],
    ]);
});

test('data aggregates with value and row', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        0,
        undefined,
        [1],
        {}
    );
    expect(transformedData).toEqual([
        ['time', 'sum of type1'],
        ['2001-01-01', 11],
        ['2001-01-02', 7],
        ['2001-01-03', 6],
    ]);
});

test('data aggregates with value and col', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        undefined,
        0,
        [1],
        {}
    );
    expect(transformedData).toEqual([
        ['', '2001-01-01', '2001-01-02', '2001-01-03'],
        ['sum of type1', 11, 7, 6],
    ]);
});

test('data aggregates by all rows with invalid values (sum)', () => {
    const transformedData = transformData(
        testData2,
        true,
        false,
        undefined,
        undefined,
        undefined,
        {}
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['sum', 22, 50, 401],
    ]);
});

// AGG GENERAL
test('data aggregates with specified series/vals 1', () => {
    const transformedData = transformData(
        testData3,
        true,
        false,
        0,
        2,
        [1],
        {}
    );
    expect(transformedData).toEqual([
        ['time', 'blue', 'pink', 'yellow'],
        ['2001-01-01', 14, 74, 21],
        ['2001-01-02', 30, 102, null],
        ['2001-01-03', 37, 72, 94],
    ]);
});

test('data aggregates with specified series/vals 2', () => {
    const transformedData = transformData(testData3, true, false, 0, 2, [1], {
        1: 'avg',
        2: 'sum',
        3: 'count',
    });

    expect(transformedData).toEqual([
        ['time', 'blue', 'pink', 'yellow'],
        ['2001-01-01', 7, 74, 1],
        ['2001-01-02', 15, 102, null],
        ['2001-01-03', 37, 72, 2],
    ]);
});

test('data aggregates with specified series/vals 3', () => {
    const transformedData = transformData(testData3, true, false, 0, 2, [1], {
        1: 'min',
        2: 'max',
        3: 'med',
    });
    expect(transformedData).toEqual([
        ['time', 'blue', 'pink', 'yellow'],
        ['2001-01-01', 1, 74, 21],
        ['2001-01-02', -1, 99, null],
        ['2001-01-03', 37, 72, 47],
    ]);
});

// SWITCH
test('switch row/col works', () => {
    const switchedData = transformData(testData, false, true);

    expect(switchedData).toEqual([
        [
            'time',
            '2001-01-02',
            '2001-01-03',
            '2001-01-02',
            '2001-01-03',
            '2001-01-01',
            '2001-01-01',
        ],
        ['type1', 4, 2, 3, 4, 5, 6],
        ['type2', 9, 10, 10, 10, 10, 11],
        ['type3', 100, 100, 100, 100, 100, 1],
    ]);
});

test('all rows aggregate and switch work together', () => {
    const transformedData = transformData(testData, true, true);
    expect(transformedData).toEqual([
        ['', 'sum'],
        ['type1', 24],
        ['type2', 60],
        ['type3', 501],
    ]);
});

// ERROR/INVALID PARAM HANDLING
test('returns null if no data', () => {
    const transformedData = transformData([]);
    expect(transformedData).toEqual(null);
});
test('returns null if invalid index given', () => {
    const invalidIndex = transformData(
        testData3,
        true,
        false,
        10, // does not exist
        0,
        [0],
        {}
    );
    expect(invalidIndex).toEqual(null);
    const invalidIndex2 = transformData(
        testData3,
        true,
        false,
        0,
        10, // does not exist
        [0],
        {}
    );
    expect(invalidIndex2).toEqual(null);
    const invalidIndex3 = transformData(
        testData3,
        true,
        false,
        0,
        0,
        [10], // does not exist
        {}
    );
    expect(invalidIndex3).toEqual(null);
});
