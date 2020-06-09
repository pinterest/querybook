import moment from 'moment';
import { ChartScaleType } from 'const/dataDocChart';

// from: https://blog.abelotech.com/posts/number-currency-formatting-javascript/
// need to fix (12.34567 becomes 12.34,567)
export function formatNumber(num: number) {
    if (isNaN(num)) {
        return num;
    } else {
        const [numberString, ...decimals] = num.toString().split('.');
        return [
            numberString.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
            ...decimals,
        ].join('.');
    }
}

export type AxesValueType = null | 'date' | 'datetime' | 'number' | 'string';
export function getValueDataType(value: any): AxesValueType {
    if (value != null) {
        if (isNaN(value)) {
            if (moment(value, [moment.HTML5_FMT.DATE], true).isValid()) {
                return 'date';
            } else if (moment(value, [moment.ISO_8601], true).isValid()) {
                return 'datetime';
            }
            return 'string';
        } else {
            return 'number';
        }
    }
    return null;
}

export function getDefaultScaleType(value: any): ChartScaleType {
    const valueType = getValueDataType(value);
    switch (valueType) {
        case 'datetime':
            return 'time';
        case 'number':
            return 'linear';
        case 'date':
        // return 'time';
        case 'string':
        default:
            return 'category';
    }
}

export function sortTable(
    tableRows: any[][],
    columnIndex: number = 0,
    ascending: boolean = true
): any[][] {
    // Check if string are numbers, if so use number sort
    // otherwise use default sort
    // arr will be MUTATED and sorted
    if (tableRows.length === 0) {
        return tableRows;
    }

    const rowIndex = tableRows.findIndex(
        (row) => row[columnIndex] != null && row[columnIndex] !== 'null'
    );
    if (rowIndex === -1) {
        return tableRows;
    }

    const reverseMultiplier = ascending ? 1 : -1;
    if (!isNaN(tableRows[rowIndex][columnIndex] as number)) {
        return tableRows.sort((a, b) => {
            // null values are always at the end
            if (a[columnIndex] == null || isNaN(a[columnIndex])) {
                return 1;
            } else if (b[columnIndex] == null || isNaN(b[columnIndex])) {
                return -1;
            } else {
                return (a[columnIndex] - b[columnIndex]) * reverseMultiplier;
            }
        }) as any[];
    }

    return tableRows.sort(
        (a, b) => (a[columnIndex] > b[columnIndex] ? 1 : -1) * reverseMultiplier
    );
}
