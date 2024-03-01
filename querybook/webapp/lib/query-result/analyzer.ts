import BigNumber from 'bignumber.js';
import { sortBy } from 'lodash';

import { IColumnStatsAnalyzer } from './types';

function arrToBigNumber(values: any[]) {
    return values.map((v) => new BigNumber(v)).filter((n) => !n.isNaN());
}

export const columnStatsAnalyzers: IColumnStatsAnalyzer[] = [
    {
        key: 'sum',
        name: 'Sum',
        appliesToType: ['number'],
        generator: (values: any[]) => {
            const bigNumberArray = arrToBigNumber(values);
            const sum = bigNumberArray.reduce(
                (s, value) => s.plus(value),
                new BigNumber(0)
            );
            return sum.toFormat(2);
        },
    },
    {
        key: 'average',
        name: 'Average',
        appliesToType: ['number'],
        generator: (values: any[]) => {
            const bigNumberArray = arrToBigNumber(values);
            const sum = bigNumberArray.reduce(
                (s, value) => s.plus(value),
                new BigNumber(0)
            );
            const average = sum.dividedBy(bigNumberArray.length);
            return average.toFormat(2);
        },
    },
    {
        key: 'median',
        name: 'Median',
        appliesToType: ['number'],
        generator: (values: any[]) => {
            const sortedArray = arrToBigNumber(values).sort((a, b) =>
                a.comparedTo(b)
            );
            const length = sortedArray.length;
            if (length === 0) {
                return 'None';
            }
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
        generator: (values: any[]) =>
            BigNumber.min(...arrToBigNumber(values)).toFormat(2),
    },
    {
        key: 'max',
        name: 'Max',
        appliesToType: ['number'],
        generator: (values: any[]) =>
            BigNumber.max(...arrToBigNumber(values)).toFormat(2),
    },
    {
        key: 'num_of_unique_values',
        name: '# of Unique Values',
        appliesToType: ['number', 'string', 'id'],
        generator: (values: any[]) =>
            values.reduce(
                (set: Set<any>, current) => set.add(current),
                new Set()
            ).size,
    },
    {
        key: 'common_values',
        name: 'Common Values',
        appliesToType: ['string', 'id'],
        generator: (values: any[]) => {
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
].concat(window.CUSTOM_COLUMN_STATS_ANALYZERS ?? []);
