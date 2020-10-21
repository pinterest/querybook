import { IColumnTransformer } from './types';
import { formatNumber } from 'lib/utils';

const queryResultTransformers: IColumnTransformer[] = [
    {
        key: 'decimal-separator',
        name: 'Decimal Separator',
        appliesToType: ['number'],
        priority: 0,
        auto: true,
        transform: (v: any): React.ReactNode => {
            return formatNumber(v);
        },
    },
    {
        key: 'capitalize',
        name: 'Capitalize',
        appliesToType: ['string'],
        priority: 0,
        auto: false,
        transform: (v: string): React.ReactNode => {
            return v.toLocaleUpperCase();
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
