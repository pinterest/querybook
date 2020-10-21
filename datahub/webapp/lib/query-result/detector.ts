import { IColumnDetector } from './types';

const columnDetectors: IColumnDetector[] = [
    {
        type: 'string',
        priority: 0,
        on: 'value',
        checker: (v: any) => {
            const vType = typeof v;
            return vType === 'string';
        },
    },
    {
        type: 'number',
        priority: 1,
        on: 'value',
        checker: (v: any) => {
            const vType = typeof v;
            if (vType === 'number' || vType === 'bigint') {
                return true;
            } else if (vType === 'string') {
                return !isNaN(v);
            }
            return false;
        },
    },
    {
        type: 'id',
        priority: 2,
        on: 'name',
        checker: (v: any) => {
            if (
                typeof v === 'string' &&
                (['uid', 'userid', 'id'].includes(v) || v.includes('_id'))
            ) {
                return true;
            }
            return false;
        },
    },
]
    .concat(window.CUSTOM_COLUMN_DETECTORS ?? [])
    .sort((a, b) => b.priority - a.priority) as IColumnDetector[];
const columnNameDetectors = columnDetectors.filter((d) => d.on === 'name');
const columnValueDetectors = columnDetectors.filter((d) => d.on === 'value');

export function findColumnType(columnName: string, values: any[]) {
    for (const detector of columnNameDetectors) {
        if (detector.checker(columnName)) {
            return detector.type;
        }
    }

    for (const v of values) {
        for (const detector of columnValueDetectors) {
            if (detector.checker(v)) {
                return detector.type;
            }
        }
    }

    // No Type found
    return null;
}
