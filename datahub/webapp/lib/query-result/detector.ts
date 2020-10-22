import { IColumnDetector } from './types';

const columnDetectors: IColumnDetector[] = [
    {
        type: 'string',
        priority: 0,
        checker: (colName: string, values: any[]) => {
            return detectTypeForValues(values, (v) => {
                const vType = typeof v;
                return vType === 'string';
            });
        },
    },
    {
        type: 'number',
        priority: 1,
        checker: (colName: string, values: any[]) => {
            return detectTypeForValues(values, (v) => {
                const vType = typeof v;
                if (vType === 'number' || vType === 'bigint') {
                    return true;
                } else if (vType === 'string') {
                    return !isNaN(v);
                }
                return false;
            });
        },
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

function detectTypeForValues<T>(
    values: T[],
    detector: (value: T) => boolean,
    mode: 'some' | 'every' = 'some'
): boolean {
    return mode === 'some' ? values.some(detector) : values.every(detector);
}
