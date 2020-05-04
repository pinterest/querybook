import { cloneDeep, range } from 'lodash';
import { ChartDataAggType } from 'const/dataDocChart';
import { sortTable, getValueDataType } from './chart-utils';

const emptyCellValue = 'No Value';

// from: https://stackoverflow.com/questions/4492678/swap-rows-with-columns-transposition-of-a-matrix-in-javascript
function switchData(data: readonly any[][]) {
    return Object.keys(data[0]).map((col) => data.map((row) => row[col]));
}

// from: https://stackoverflow.com/questions/45309447/calculating-median-javascript
function getMedian(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    const numArray = values.slice().sort((a, b) => a - b);
    const half = Math.floor(numArray.length / 2);
    if (numArray.length % 2) {
        return numArray[half];
    } else {
        return (numArray[half - 1] + numArray[half]) / 2.0;
    }
}

function sortByType<T>(arr: T[]): T[] {
    // Check if string are numbers, if so use number sort
    // otherwise use default sort
    // arr will be MUTATED and sorted
    if (arr.length === 0) {
        return arr;
    }

    const isFirstValueNumber = !isNaN(arr[0] as any);
    if (isFirstValueNumber) {
        const numArr: number[] = arr as any[];
        return numArr.sort((a, b) => a - b) as any[];
    }
    return arr.sort();
}

function isNumber(value: any) {
    return value != null && !isNaN(value);
}

function safeDiv(x: number, y: number) {
    if (y === 0) {
        return 0;
    }
    return x / y;
}

function getFilterNumberArr(values: any[]): number[] {
    return values.filter(isNumber).map(Number);
}

class PivotReducer<T> {
    public getInitialValue: () => T;
    public reducerFunction: (agg: T, val: any) => T;
    public endReducerFunction?: (agg: T) => any;

    constructor(
        initialValue: T,
        reducerFunction: (agg: T, val: any) => T,
        endReducerFunction: (agg: T) => any = null
    ) {
        this.getInitialValue = () => cloneDeep(initialValue);
        this.reducerFunction = reducerFunction;
        this.endReducerFunction = endReducerFunction;
    }
}

const ChartReducers = {
    avg: new PivotReducer(
        { count: 0, sum: 0 },
        (agg, val) => {
            if (isNumber(val)) {
                agg.count += 1;
                agg.sum += Number(val);
            }
            return agg;
        },
        (agg) => safeDiv(agg.sum, agg.count)
    ),
    count: new PivotReducer(0, (agg) => agg + 1),
    min: new PivotReducer(Infinity, (a, b) =>
        isNumber(b) && Number(b) < a ? Number(b) : a
    ),
    max: new PivotReducer(-Infinity, (a, b) =>
        isNumber(b) && Number(b) > a ? Number(b) : a
    ),
    med: new PivotReducer(
        [],
        (agg, val) => {
            agg.push(val);
            return agg;
        },
        (values) => {
            return getMedian(getFilterNumberArr(values));
        }
    ),
    sum: new PivotReducer(0, (agg, val) =>
        isNumber(val) ? agg + Number(val) : agg
    ),
};

const getChartReducer = (aggType?: ChartDataAggType) =>
    aggType in ChartReducers ? ChartReducers[aggType] : ChartReducers.sum;

function getDistinctValuesAndIndexMap(
    values: any[]
): [any[], Record<any, number>] {
    const distinctValues = sortByType([...new Set(values)]);
    const distinctValToIndex: Record<any, number> = distinctValues.reduce(
        (hash, val, index) => {
            hash[val] = index;
            return hash;
        },
        {}
    );

    return [distinctValues, distinctValToIndex];
}

function aggregateData(
    data: readonly any[][],
    aggRowIndex: number = 0,
    aggColIndex: number = 1,
    aggValueIndex: number[] = [2],
    aggSeries: {
        [seriesIdx: number]: ChartDataAggType;
    } = {}
) {
    if (
        Math.max(aggRowIndex, aggColIndex, ...aggValueIndex) >= data[0].length
    ) {
        return null;
    }

    const cols = data[0];
    const rows = data.slice(1);
    /*
        Final output will be

        outputColumns
        ---------------------------
        firstColumnsRows | aggregatedValues
    */
    let outputColumns: string[];
    let firstColumnRows: any[];
    // each row, col contains all the pre-aggregated values
    let collectedValues: any[][];

    if (aggRowIndex === -1) {
        // aggregate all rows except first column
        outputColumns = ['', ...cols.slice(1)];
        firstColumnRows = ['Aggregated Values'];

        const allRowsExceptFirstColumn = rows.map((row) => row.slice(1));

        // array of 1 row of array of column.length - 1 with all []
        collectedValues = [
            range(Math.max(outputColumns.length - 1, 0)).map((_, index) =>
                getChartReducer(aggSeries[index + 1]).getInitialValue()
            ),
        ];
        for (const row of allRowsExceptFirstColumn) {
            for (const [index, val] of row.entries()) {
                collectedValues[0][index] = getChartReducer(
                    aggSeries[index + 1]
                ).reducerFunction(collectedValues[0][index], val);
            }
        }
    } else {
        // Aggregation when given pivot column, row and value
        const [
            distinctColValues,
            distinctColValToIndex,
        ] = getDistinctValuesAndIndexMap(rows.map((row) => row[aggColIndex]));
        const [
            distinctRowValues,
            distinctRowValToIndex,
        ] = getDistinctValuesAndIndexMap(rows.map((row) => row[aggRowIndex]));
        outputColumns = [cols[aggRowIndex], ...distinctColValues];
        firstColumnRows = distinctRowValues;
        collectedValues = range(distinctRowValues.length).map((_) =>
            range(distinctColValues.length).map((__) => emptyCellValue)
        );

        for (const row of rows) {
            const rowIndex = distinctRowValToIndex[row[aggRowIndex]];
            const colIndex = distinctColValToIndex[row[aggColIndex]];
            const reducer = getChartReducer(aggSeries[colIndex + 1]);
            collectedValues[rowIndex][colIndex] = reducer.reducerFunction(
                collectedValues[rowIndex][colIndex] === emptyCellValue
                    ? reducer.getInitialValue()
                    : collectedValues[rowIndex][colIndex],
                row[aggValueIndex[0]]
            );
        }
    }

    // Aggregate collected values
    for (const colIndex of range(outputColumns.length - 1)) {
        const { endReducerFunction } = getChartReducer(aggSeries[colIndex + 1]);
        if (endReducerFunction) {
            for (const row of collectedValues) {
                const value = row[colIndex];
                const finalValue =
                    value !== emptyCellValue
                        ? endReducerFunction(value)
                        : value;
                row[colIndex] = finalValue;
            }
        }
    }

    // stitching everything together
    const aggregatedData = [
        outputColumns,
        ...firstColumnRows.map((firstValue, index) => [
            firstValue,
            ...collectedValues[index],
        ]),
    ];

    return aggregatedData;
}

export function sortTableWithDefaultIdx(
    data: any[][],
    idx: number,
    ascending: boolean,
    xIdx: number
) {
    if (idx != null) {
        // if idx is provided then call sortTable as is
        return sortTable(data, idx, ascending);
    } else {
        // if idx is not provided then default idx to the xIndex of the table
        // only sort if the column type for that index is either 'date' 'datetime' or 'number'
        if (
            getValueDataType(data[0][xIdx]) === 'string' ||
            getValueDataType(data[0][xIdx]) === null
        ) {
            return data;
        } else {
            return sortTable(data, xIdx, ascending);
        }
    }
}

export function transformData(
    data: any[][],
    isAggregate: boolean = false,
    isSwitch: boolean = false,
    formatAgg: number = 0,
    formatSeries: number = 1,
    formatValueCols: number[] = [2],
    aggSeries: {
        [seriesIdx: number]: ChartDataAggType;
    } = {},
    // tslint:disable-next-line: no-unnecessary-initializer
    sortIdx: number = undefined,
    sortAsc: boolean = true,
    xAxisIdx: number = 0
) {
    if (data?.length < 2) {
        return null;
    }

    let transformedData = cloneDeep(data);

    if (isAggregate) {
        transformedData = aggregateData(
            data,
            formatAgg,
            formatSeries,
            formatValueCols,
            aggSeries
        );
    }

    if (transformedData == null) {
        return null;
    }

    if (isSwitch) {
        transformedData = switchData(transformedData);
    }

    return [
        transformedData[0],
        ...sortTableWithDefaultIdx(
            transformedData.slice(1),
            sortIdx,
            sortAsc,
            xAxisIdx
        ),
    ];
}
