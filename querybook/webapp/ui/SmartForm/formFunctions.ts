import produce from 'immer';

export function updateValue<T>(
    item: T,
    path: string, // example: 'name', or 'url.5' or 'params.username' or 'params.1.username'
    newVal: any,
    deleteIfValueEquals = [undefined]
): T {
    if (!path) {
        return newVal;
    }
    return produce(item, (draft) => {
        const fieldNames = path.split('.');
        let innerItem = draft;
        for (let i = 0; i < fieldNames.length - 1; i++) {
            innerItem = innerItem[fieldNames[i]];
        }
        const lastFieldName = fieldNames[fieldNames.length - 1];

        if (deleteIfValueEquals.includes(newVal)) {
            // Deletion
            if (Array.isArray(innerItem)) {
                innerItem.splice(Number(lastFieldName), 1);
            } else {
                delete innerItem[lastFieldName];
            }
            return;
        }

        innerItem[lastFieldName] = newVal;
    });
}

// First boolean represents True if valid, False otherwise
// Second string represents the error Message
// Third string represents the path
type validationResp = [boolean, string, string];

export function validateForm(value: any, form: AllFormField): validationResp {
    const fieldType = form.field_type;

    if (fieldType === 'list') {
        if (value == null) {
            return [false, 'Invalid value for list', ''];
        }

        const arrayForm = form as IExpandableFormField;
        if (arrayForm.min != null && value.length < arrayForm.min) {
            return [false, `length less than min ${arrayForm.min}`, ''];
        } else if (arrayForm.max != null && value.length > arrayForm.max) {
            return [false, `length more than max ${arrayForm.max}`, ''];
        }

        for (const [idx, cVal] of (value as []).entries()) {
            const resp = validateForm(cVal, arrayForm.of);
            if (!resp[0]) {
                return [
                    resp[0],
                    resp[1],
                    `${idx}${resp[2] ? '.' : ''}${resp[2]}`,
                ];
            }
        }
    } else if (fieldType === 'struct') {
        if (value == null) {
            return [false, 'Invalid value for struct', ''];
        }

        for (const [key, subfield] of Object.entries(
            (form as IStructFormField).fields
        )) {
            const resp = validateForm(value[key], subfield);
            if (!resp[0]) {
                return [
                    resp[0],
                    resp[1],
                    `${key}${resp[2] ? '.' : ''}${resp[2]}`,
                ];
            }
        }
    } else {
        return validateFormField(value, form as IFormField);
    }

    return [true, null, null];
}

function validateFormField(value: any, field: IFormField): validationResp {
    const { required, regex } = field;
    if (required) {
        if (!value) {
            return [false, `cannot be empty`, ''];
        }
    }
    if (regex && value) {
        const re = new RegExp(regex);
        if (!value.match(re)) {
            return [false, `does not match ${regex}`, ''];
        }
    }

    return [true, null, null];
}

export function getDefaultFormValue(
    form: AllFormField
): [] | Record<string, unknown> | ReturnType<typeof getDefaultFormFieldValue> {
    const fieldType = form.field_type;
    if (fieldType === 'list') {
        return [];
    } else if (fieldType === 'struct') {
        return Object.entries((form as IStructFormField).fields).reduce(
            (hash, [key, field]) => {
                hash[key] = getDefaultFormValue(field);
                return hash;
            },
            {}
        );
    }

    return getDefaultFormFieldValue(form as IFormField);
}

function getDefaultFormFieldValue(field: IFormField) {
    const { field_type: fieldType, required } = field;

    if (!required) {
        return undefined;
    }

    if (fieldType === 'string') {
        return '';
    } else if (fieldType === 'number') {
        return 0;
    } else if (fieldType === 'boolean') {
        return false;
    }
}
