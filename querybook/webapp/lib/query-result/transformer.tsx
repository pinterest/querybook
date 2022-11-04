import JSONBig from 'json-bigint';
import React from 'react';

import {
    formatNumber,
    getHumanReadableNumber,
    isNumeric,
    roundNumberToDecimal,
} from 'lib/utils/number';
import { Json } from 'ui/Json/Json';
import { Link } from 'ui/Link/Link';

import { IColumnTransformer } from './types';

const JSONBigString = JSONBig({ storeAsString: true });

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
        key: 'url',
        name: 'Url Links',
        appliesToType: ['url'],
        priority: 0,
        auto: true,
        transform: (v: string): React.ReactNode => (
            <Link to={v} naturalLink>
                {v}
            </Link>
        ),
    },
    {
        key: 'parse-json',
        name: 'Parse JSON',
        appliesToType: ['json'],
        priority: 0,
        auto: false,
        transform: (v: string): React.ReactNode => {
            try {
                const json = JSONBigString.parse(v);
                // Cannot pass following into <ReactJson />, returning original value in order to protect ReactJson from failing
                if (!json || typeof json !== 'object') {
                    return v;
                }
                return <Json json={json} />;
            } catch (e) {
                console.error(e);
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
