import { isBoolean, isNumber } from 'lodash';

export const SUPPORTED_TYPES = ['boolean', 'number', 'string'] as const;
export type TSupportedTypes = typeof SUPPORTED_TYPES[number];

type TTemplateVariableType = boolean | number | string;
export type TTemplateVariableDict = Record<string, TTemplateVariableType>;

export function detectVariableType(value: any): TSupportedTypes {
    if (isBoolean(value)) {
        return 'boolean';
    }
    if (isNumber(value)) {
        return 'number';
    }
    return 'string';
}

export function getVariableValueByType(
    value: any,
    valueType: TSupportedTypes
): any {
    if (value !== null) {
        if (valueType === 'number') {
            value = Number(value);
        } else if (valueType === 'string') {
            value = value.toString();
        }
    }
    return value;
}
