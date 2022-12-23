import { IDataDocMetaVariable, TDataDocMetaVariableType } from 'const/datadoc';
import { isBoolean, isNumber } from 'lodash';

export function detectVariableType(value: any): TDataDocMetaVariableType {
    if (isBoolean(value)) {
        return 'boolean';
    }
    if (isNumber(value)) {
        return 'number';
    }
    return 'string';
}

function getVariableValueByType(
    value: any,
    valueType: TDataDocMetaVariableType
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

export function typeCastVariables(
    variables: IDataDocMetaVariable[]
): IDataDocMetaVariable[] {
    return variables.map(({ name, type, value }) => ({
        name,
        type,
        value: getVariableValueByType(value, type),
    }));
}
