import { isArray, isObject, isString } from 'lodash';

export function extractFormikError(rootErrors: Record<string, any>): string[] {
    const errorDescriptions = [];

    const helper = (errors: any, path: string = '') => {
        if (isString(errors)) {
            errorDescriptions.push(`${path}: ${errors}`);
            return;
        }
        if (isObject(errors) || isArray(errors)) {
            // It can be an array, object, or string
            for (const [parentName, childErrors] of Object.entries(errors)) {
                helper(
                    childErrors,
                    path ? path + '.' + parentName : parentName
                );
            }
        }
    };

    helper(rootErrors);

    return errorDescriptions;
}
