import { sampleSize } from 'lodash';

import { isValidUrl } from 'lib/utils';
import { isBoolean } from 'lib/utils/boolean';
import { isNumeric } from 'lib/utils/number';

import { isCellValNull } from './helper';
import { IColumnDetector } from './types';

const columnDetectors: IColumnDetector[] = [
    {
        type: 'string',
        priority: 0,
        checker: (colName: string, values: any[]) => true,
    },
    {
        type: 'json',
        priority: 0.1,
        checker: (colName: string, values: any[]) =>
            detectTypeForValues(values, (value) => {
                try {
                    const parsed = JSON.parse(value);
                    return (
                        parsed && // to prevent null
                        typeof parsed === 'object'
                    );
                } catch (e) {
                    return false;
                }
            }),
    },
    {
        type: 'url',
        priority: 0.2,
        checker: (colName: string, values: any[]) =>
            detectTypeForValues(values, isValidUrl),
    },
    {
        type: 'boolean',
        priority: 0.5,
        checker: (colName: string, values: any[]) =>
            detectTypeForValues(values, isBoolean),
    },
    {
        type: 'number',
        priority: 1,
        checker: (colName: string, values: any[]) =>
            detectTypeForValues(values, isNumeric),
    },
    {
        type: 'id',
        priority: 2,
        checker: (colName: string, values: any[]) => {
            if (
                typeof colName === 'string' &&
                (['uid', 'userid', 'id'].includes(colName) ||
                    colName.includes('_id'))
            ) {
                return true;
            }
            return false;
        },
    },
]
    .concat(window.CUSTOM_COLUMN_DETECTORS ?? [])
    .sort((a, b) => b.priority - a.priority) as IColumnDetector[];

export function getColumnTypesForTable(columns: string[], rows: any[][]) {
    const sizeOfSample = Math.max(
        DETECTOR_MIN_SAMPLE_SIZE,
        Math.floor(rows.length / 100)
    );
    return columns.map((colName, index) => {
        const notNullRowValues = rows
            .map((row) => row[index])
            .filter((value) => !isCellValNull(value));

        const sampledRowValues = sampleSize(notNullRowValues, sizeOfSample);
        return findColumnType(colName, sampledRowValues);
    });
}

export function findColumnType(columnName: string, values: any[]) {
    for (const detector of columnDetectors) {
        if (detector.checker(columnName, values)) {
            return detector.type;
        }
    }

    // No Type found
    return null;
}

const DETECTOR_MIN_SAMPLE_SIZE = 5;

export function detectTypeForValues<T>(
    values: T[],
    detector: (value: T) => boolean
): boolean {
    // No information can be extracted from empty array
    if (values.length === 0) {
        return false;
    }

    return values.every(detector);
}
