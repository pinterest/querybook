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

// mixed vals
const testData4 = [
    ['time', 'val', 'color'],
    ['2001-01-01', '1.2', 'blue'],
    ['2001-01-01', null, 'blue'],
    ['2001-01-01', '50.0', 'yellow'],
    ['2001-01-01', 'null', 'pink'],

    ['2001-01-02', '-9.0', 'blue'],
    ['2001-01-02', '42.9', 'pink'],
    ['2001-01-02', '-33.4', 'blue'],
    ['2001-01-02', '0.9', 'pink'],
];

// AGG BY ALL ROWS
test('data aggregates by all rows (sum)', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        -1,
        undefined,
        undefined,
        {}
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['Aggregated Values', 24, 60, 501],
    ]);
});
test('data aggregates by all rows with invalid values (sum)', () => {
    const transformedData = transformData(
        testData2,
        true,
        false,
        -1,
        undefined,
        undefined,
        {}
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['Aggregated Values', 22, 50, 401],
    ]);
});

test('data aggregates by all rows (sum, avg, count)', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        -1,
        undefined,
        undefined,
        {
            1: 'sum',
            2: 'avg',
            3: 'count',
        }
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['Aggregated Values', 24, 10, 6],
    ]);
});
test('data aggregates by all rows with invalid vals (sum, avg, count)', () => {
    const transformedData = transformData(
        testData2,
        true,
        false,
        -1,
        undefined,
        undefined,
        {
            1: 'sum',
            2: 'avg',
            3: 'count',
        }
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['Aggregated Values', 22, 10, 6],
    ]);
});

test('data aggregates by all rows (min, max, med)', () => {
    const transformedData = transformData(
        testData,
        true,
        false,
        -1,
        undefined,
        undefined,
        {
            1: 'min',
            2: 'max',
            3: 'med',
        }
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['Aggregated Values', 2, 11, 100],
    ]);
});
test('data aggregates by all rows with invalid vals (min, max, med)', () => {
    const transformedData = transformData(
        testData2,
        true,
        false,
        -1,
        undefined,
        undefined,
        {
            1: 'min',
            2: 'max',
            3: 'med',
        }
    );
    expect(transformedData).toEqual([
        ['', 'type1', 'type2', 'type3'],
        ['Aggregated Values', 3, 11, 100],
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
        ['2001-01-02', 30, 102, 'No Value'],
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
        ['2001-01-02', 15, 102, 'No Value'],
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
        ['2001-01-02', -1, 99, 'No Value'],
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
    const transformedData = transformData(testData, true, true, -1, 1, [2], {});
    expect(transformedData).toEqual([
        ['', 'Aggregated Values'],
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

// sorts
test('returns sorted data', () => {
    const sortedData = transformData(
        testData4,
        false,
        false,
        null,
        null,
        null,
        null,
        1,
        true,
        1
    );
    expect(sortedData).toEqual([
        ['time', 'val', 'color'],
        ['2001-01-02', '-33.4', 'blue'],
        ['2001-01-02', '-9.0', 'blue'],
        ['2001-01-02', '0.9', 'pink'],
        ['2001-01-01', '1.2', 'blue'],
        ['2001-01-02', '42.9', 'pink'],
        ['2001-01-01', '50.0', 'yellow'],
        ['2001-01-01', null, 'blue'],
        ['2001-01-01', 'null', 'pink'],
    ]);
});
