import { shuffle } from 'lodash';

import { isValidUrl } from 'lib/utils';
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
                    JSON.parse(value);
                    return true;
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
    return (
        // The strategy is to first pick the first not null value to check
        // if that passes, then pick some randomly sampled values to confirm
        detectTypeForFirstNotNullValue(values, detector) &&
        detectTypeForSampledValuesValue(values, detector)
    );
}

function detectTypeForFirstNotNullValue<T>(
    values: T[],
    detector: (value: T) => boolean
): boolean {
    for (const value of values) {
        if (!isCellValNull(value)) {
            return detector(value);
        }
    }
    // No information can be extracted from empty array
    return false;
}

function detectTypeForSampledValuesValue<T>(
    values: T[],
    detector: (value: T) => boolean
): boolean {
    const sizeOfSample = Math.max(
        DETECTOR_MIN_SAMPLE_SIZE,
        Math.floor(values.length / 100)
    );
    const shuffledValues = shuffle(values);
    const sampleValues: T[] = [];
    for (const value of shuffledValues) {
        if (sampleValues.length >= sizeOfSample) {
            break;
        }
        if (isCellValNull(value)) {
            continue;
        }
        sampleValues.push(value);
    }
    return sampleValues.every(detector);
}
