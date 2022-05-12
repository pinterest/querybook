import React from 'react';

import { titleize } from 'lib/utils';
import { getDefaultFormValue } from './formFunctions';

import { SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { DebouncedPasswordInput } from 'ui/DebouncedInput/DebouncedPasswordInput';
import {
    FormField,
    FormFieldInputSection,
    FormFieldHelpSection,
} from 'ui/Form/FormField';
import { Markdown } from 'ui/Markdown/Markdown';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './SmartForm.scss';

export {
    updateValue,
    validateForm,
    getDefaultFormValue,
} from './formFunctions';

export type TemplatedForm = AllFormField;
type onChangeFunc<T> = (path: string, value: T) => any;

export function prependOnChangePath<T>(
    path: string,
    onChange: onChangeFunc<T>
) {
    return (subpath: string, value: T) =>
        onChange(subpath ? path + '.' + subpath : path, value);
}

function SimpleFormField<T>({
    formField,
    value,
    onChange,
}: {
    formField: IFormField;
    value: T;
    onChange: onChangeFunc<T>;
}) {
    const onFieldChange = React.useCallback(
        (newVal: any) => onChange('', newVal),
        [onChange]
    );
    const {
        description,
        hidden,
        required,
        helper,
        field_type: fieldType,
        options,
    } = formField;
    let controlDOM: React.ReactChild;
    if (fieldType === 'string' || fieldType === 'number') {
        const inputProps = {
            className: 'input',
        };

        let InputComponent = DebouncedInput;
        if (fieldType === 'number') {
            inputProps['type'] = 'number';
        } else if (hidden) {
            InputComponent = DebouncedPasswordInput;
        }

        if (description) {
            inputProps['placeholder'] = description;
        }

        controlDOM = (
            <InputComponent
                value={(value as unknown) as string}
                onChange={onFieldChange}
                inputProps={inputProps}
                debounceTime={10}
                flex
            />
        );
    } else if (fieldType === 'boolean') {
        controlDOM = (
            <ToggleSwitch checked={!!value} onChange={onFieldChange} />
        );
    } else if (fieldType === 'select') {
        controlDOM = (
            <SimpleReactSelect
                value={(value as unknown) as string}
                options={options}
                onChange={onFieldChange}
            />
        );
    }

    return (
        <div>
            <FormField required={required}>
                <FormFieldInputSection>{controlDOM}</FormFieldInputSection>
                {helper ? (
                    <FormFieldHelpSection>
                        <Markdown>{helper}</Markdown>
                    </FormFieldHelpSection>
                ) : null}
            </FormField>
        </div>
    );
}

function ExpandableFormField<T extends []>({
    formField,
    value,
    onChange,
}: {
    formField: IExpandableFormField;
    value: T;
    onChange: onChangeFunc<T>;
}) {
    React.useEffect(() => {
        // If the array maps to a null or undefined key,
        // mutate the item so that it defaults to an empty array
        if (value == null) {
            onChange('', [] as any);
        }
    }, [value]);

    if (!Array.isArray(value)) {
        return <div className="ExpandableFormField">Invalid Field</div>;
    }

    const arrayFieldDOM = value.map((cVal, index) => (
        <div className="SmartForm-array-section flex-row" key={index}>
            <FormField stacked>
                <SmartForm
                    formField={formField.of}
                    onChange={prependOnChangePath(String(index), onChange)}
                    value={cVal}
                />
            </FormField>
            <IconButton
                icon="X"
                onClick={onChange.bind(null, String(index), undefined)}
            />
        </div>
    ));

    return (
        <>
            {arrayFieldDOM}
            <div className="SmartForm-button-box flex-row">
                <SoftButton
                    title="Add More"
                    icon="Plus"
                    onClick={onChange.bind(
                        null,
                        `${value.length}`,
                        getDefaultFormValue(formField.of)
                    )}
                />
            </div>
        </>
    );
}

function StructFormField<T extends Record<string, unknown>>({
    formField,
    value,
    onChange,
}: {
    formField: IStructFormField;
    value: T;
    onChange: onChangeFunc<T>;
}) {
    const fieldsDOM = Object.entries(formField.fields).map(
        ([key, subField]) => (
            <FormField key={key} stacked label={titleize(key)}>
                <SmartForm
                    formField={subField}
                    value={value[key]}
                    onChange={prependOnChangePath(key, onChange)}
                />
            </FormField>
        )
    );

    return <>{fieldsDOM}</>;
}

export function SmartForm<T>({
    formField,
    value,
    onChange,
}: {
    formField: AllFormField;
    value: T;
    onChange: onChangeFunc<T>;
}) {
    const fieldType = formField.field_type;
    const formDOM =
        fieldType === 'list' ? (
            <ExpandableFormField<[]>
                formField={formField as IExpandableFormField}
                value={(value as unknown) as []}
                onChange={(onChange as unknown) as onChangeFunc<[]>}
            />
        ) : fieldType === 'struct' ? (
            <StructFormField<Record<string, any>>
                formField={formField as IStructFormField}
                value={value}
                onChange={onChange}
            />
        ) : (
            <SimpleFormField<T>
                formField={formField as IFormField}
                value={value}
                onChange={onChange}
            />
        );
    return <div className="SmartForm">{formDOM}</div>;
}
