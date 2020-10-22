import moment from 'moment';

import { isNumeric } from 'lib/utils/number';
import { ChartScaleType } from 'const/dataDocChart';

export type AxesValueType = null | 'date' | 'datetime' | 'number' | 'string';
export function getValueDataType(value: any): AxesValueType {
    if (value != null) {
        if (!isNumeric(value)) {
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
            return 'time';
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
    const comparator = isNumeric(tableRows[rowIndex][columnIndex])
        ? (a, b) => a - b
        : (a, b) => (a < b ? -1 : 1);
    return tableRows.sort((a, b) => {
        // null values are always at the end
        if (a[columnIndex] == null || a[columnIndex] === 'null') {
            return 1;
        } else if (b[columnIndex] == null || b[columnIndex] === 'null') {
            return -1;
        } else {
            return (
                comparator(a[columnIndex], b[columnIndex]) * reverseMultiplier
            );
        }
    }) as any[];
}
