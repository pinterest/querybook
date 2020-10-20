import BigNumber from 'bignumber.js';
import { sortBy } from 'lodash';
import { IColumnStatsPresenter, IColumnDetector } from './types';

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
].sort((a, b) => b.priority - a.priority) as IColumnDetector[];
const columnNameDetectors = columnDetectors.filter((d) => d.on === 'name');
const columnValueDetectors = columnDetectors.filter((d) => d.on === 'value');

function arrToBigNumber(values: any[]) {
    return values.map((v) => new BigNumber(v)).filter((n) => !n.isNaN());
}

export const columnStatsPresenters: IColumnStatsPresenter[] = [
    {
        key: 'average',
        name: 'Average',
        appliesToType: ['number'],
        generator: (values) => {
            const bigNumberArray = arrToBigNumber(values);
            const sum = bigNumberArray.reduce((s, value) => {
                return s.plus(value);
            }, new BigNumber(0));
            const average = sum.dividedBy(bigNumberArray.length);
            return average.toFormat(2);
        },
    },
    {
        key: 'median',
        name: 'Median',
        appliesToType: ['number'],
        generator: (values) => {
            const sortedArray = arrToBigNumber(values).sort((a, b) => {
                return a.comparedTo(b);
            });
            const length = sortedArray.length;
            const median =
                length % 2 === 0
                    ? sortedArray[length / 2 - 1]
                          .plus(sortedArray[length / 2])
                          .dividedBy(2)
                    : sortedArray[(length - 1) / 2];
            return median.toFormat(2);
        },
    },
    {
        key: 'min',
        name: 'Min',
        appliesToType: ['number'],
        generator: (values) => {
            return BigNumber.min(...arrToBigNumber(values)).toFormat(2);
        },
    },
    {
        key: 'max',
        name: 'Max',
        appliesToType: ['number'],
        generator: (values) => {
            return BigNumber.max(...arrToBigNumber(values)).toFormat(2);
        },
    },
    {
        key: 'num_of_unique_values',
        name: '# of Unique Values',
        appliesToType: ['number', 'string', 'id'],
        generator: (values) => {
            return values.reduce((set: Set<any>, current) => {
                return set.add(current);
            }, new Set()).size;
        },
    },
    {
        key: 'common_values',
        name: 'Common Values',
        appliesToType: ['string', 'id'],
        generator: (values) => {
            const N = 5;
            const uniques: Record<string, number> = values.reduce(
                (hash, value) => {
                    hash[value] = (hash[value] ?? 0) + 1;
                    return hash;
                },
                {}
            );
            const topUniques = sortBy(
                Object.entries(uniques).filter((o) => o[1] > 1),
                (o) => o[1]
            ).slice(0, N);
            return topUniques.length
                ? topUniques.map((pair) => pair[0]).join(', ')
                : 'All Unique.';
        },
    },
];

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
