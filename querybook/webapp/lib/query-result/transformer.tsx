import JSONBig from 'json-bigint';
import React from 'react';

import {
    formatNumber,
    getHumanReadableNumber,
    isNumeric,
    roundNumberToDecimal,
} from 'lib/utils/number';

import { IColumnTransformer } from './types';

const queryResultTransformers: IColumnTransformer[] = [
    {
        key: 'with-comma',
        name: 'With Comma',
        appliesToType: ['number'],
        priority: 1,
        auto: false,
        transform: (v: any): React.ReactNode => formatNumber(v),
    },
    {
        key: 'dollar-format',
        name: 'Dollar Format',
        appliesToType: ['number'],
        priority: 0,
        auto: false,
        transform: (v: any) => {
            const num = Number(v);
            if (!isNumeric(num)) {
                return v;
            }

            const rounded = roundNumberToDecimal(num, 2);
            return (
                <span className="right-align">{`$ ${formatNumber(rounded, '', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                })}`}</span>
            );
        },
    },
    {
        key: 'human-readable',
        name: 'Human Readable',
        appliesToType: ['number'],
        priority: 0,
        auto: false,
        transform: (v: any): React.ReactNode => getHumanReadableNumber(v, 2),
    },
    {
        key: 'capitalize',
        name: 'Capitalize',
        appliesToType: ['string'],
        priority: 0,
        auto: false,
        transform: (v: string): React.ReactNode => v.toLocaleUpperCase(),
    },
    {
        key: 'prettify',
        name: 'Prettify',
        appliesToType: ['json'],
        priority: 0,
        auto: false,
        transform: (v: string): React.ReactNode => {
            try {
                return JSONBig.stringify(JSONBig.parse(v), null, 2);
            } catch (e) {
                return v;
            }
        },
    },
]
    .concat(window.CUSTOM_COLUMN_TRANSFORMERS ?? [])
    .sort((a, b) => b.priority - a.priority) as IColumnTransformer[];

const transformersForType: Record<
    string,
    [IColumnTransformer[], IColumnTransformer | null]
> = queryResultTransformers.reduce(
    (hash: typeof transformersForType, transformer) => {
        for (const type of transformer.appliesToType) {
            if (!(type in hash)) {
                hash[type] = [[], null];
            }

            hash[type][0].push(transformer);
            if (transformer.auto && hash[type][1] == null) {
                hash[type][1] = transformer;
            }
        }

        return hash;
    },
    {}
);

export function getTransformersForType(colType: string) {
    return transformersForType[colType] ?? [[], null];
}
