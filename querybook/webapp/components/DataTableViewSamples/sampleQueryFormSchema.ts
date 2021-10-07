import { ITableSampleParams } from 'const/metastore';

export const COMPARSION_OPS_WITH_VALUE = [
    '=',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    'LIKE',
];
export const COMPARSION_OPS = COMPARSION_OPS_WITH_VALUE.concat([
    'IS NULL',
    'IS NOT NULL',
]);

export interface ITableSamplesFormValues {
    engineId: number;
    partition?: string;
    where: [[string, string, string]];
    order_by?: string;
    order_by_asc: boolean;
}

export function tableSamplesFormValuesToParams(
    values: ITableSamplesFormValues
) {
    const sampleParams: ITableSampleParams = {};
    if (values.partition) {
        sampleParams.partition = values.partition;
    }
    if (values.order_by) {
        sampleParams.order_by = values.order_by;
    }
    sampleParams.order_by_asc = values.order_by_asc;

    if (values.where[0]) {
        sampleParams.where = values.where.filter((clause) => clause[0]);
    }
    return sampleParams;
}
