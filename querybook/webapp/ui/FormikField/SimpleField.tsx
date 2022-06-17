import { useField } from 'formik';
import React, { useMemo } from 'react';

import { titleize } from 'lib/utils';
import { FormField, IFormFieldProps } from 'ui/Form/FormField';

import { CheckboxField, ICheckboxFieldProps } from './CheckboxField';
import type { ICodeEditorFieldProps } from './CodeEditorField';
import { DatePickerField } from './DatePickerField';
import { IInputFieldProps, InputField } from './InputField';
import { INumberFieldProps, NumberField } from './NumberField';
import { IReactSelectFieldProps, ReactSelectField } from './ReactSelectField';
import { IRichTextFieldProps, RichTextField } from './RichTextField';
import { ISelectFieldProps, SelectField } from './SelectField';
import { ITextareaFieldProps, TextareaField } from './TextareaField';
import {
    IToggleSwitchFieldProps,
    ToggleSwitchField,
} from './ToggleSwitchField';

// Since this is rarely used (only UDF) and quite heavy (multiple language defs), it is
// lazily imported
const CodeEditorField = React.lazy(() => import('./CodeEditorField'));

// Simple Field is the amalgamation of all custom field,
// it contains all the simple use case of field

interface IBaseProps extends IFormFieldProps {
    name: string; // name is used as title
}

interface ISimpleCheckboxProps extends IBaseProps, ICheckboxFieldProps {
    type: 'checkbox';
}

interface ISimpleInputProps extends IBaseProps, IInputFieldProps {
    type: 'input';
}

interface ISimpleNumberProps extends IBaseProps, INumberFieldProps {
    type: 'number';
}

interface ISimpleReactSelectProps extends IBaseProps, IReactSelectFieldProps {
    type: 'react-select';
}

interface ISimpleToggleProps extends IBaseProps, IToggleSwitchFieldProps {
    type: 'toggle';
}

interface ISimpleRichTextProps extends IBaseProps, IRichTextFieldProps {
    type: 'rich-text';
}

interface ISimpleTextareaProps extends IBaseProps, ITextareaFieldProps {
    type: 'textarea';
}

interface ISimpleSelectProps extends IBaseProps, ISelectFieldProps {
    type: 'select';
}

interface ISimpleDatePickerProps extends IBaseProps {
    type: 'datepicker';
}

interface ISimpleCodeEditorProps extends IBaseProps, ICodeEditorFieldProps {
    type: 'code-editor';
}

type Props =
    | ISimpleCheckboxProps
    | ISimpleInputProps
    | ISimpleNumberProps
    | ISimpleSelectProps
    | ISimpleToggleProps
    | ISimpleTextareaProps
    | ISimpleRichTextProps
    | ISimpleReactSelectProps
    | ISimpleDatePickerProps
    | ISimpleCodeEditorProps;

export const SimpleField: React.FC<Props> = ({
    name,
    label,
    help,
    type,
    stacked,
    className,
    required,
    ...otherProps
}) => {
    const title = useMemo(() => {
        if (label != null) {
            return label;
        }
        const parts = name.replace(/\[[0-9]+\]/, '').split('.');
        return titleize(parts[parts.length - 1], '_', ' ');
    }, [name, label]);

    const [field, meta, helpers] = useField(name);

    let fieldDOM = null;
    if (type === 'checkbox') {
        fieldDOM = (
            <CheckboxField
                name={name}
                {...(otherProps as ICheckboxFieldProps)}
            />
        );
    } else if (type === 'input') {
        fieldDOM = (
            <InputField name={name} {...(otherProps as IInputFieldProps)} />
        );
    } else if (type === 'number') {
        fieldDOM = (
            <NumberField name={name} {...(otherProps as INumberFieldProps)} />
        );
    } else if (type === 'select') {
        fieldDOM = (
            <SelectField name={name} {...(otherProps as ISelectFieldProps)} />
        );
    } else if (type === 'react-select') {
        fieldDOM = (
            <ReactSelectField
                name={name}
                {...(otherProps as IReactSelectFieldProps)}
            />
        );
    } else if (type === 'toggle') {
        fieldDOM = (
            <ToggleSwitchField
                name={name}
                {...(otherProps as IToggleSwitchFieldProps)}
            />
        );
    } else if (type === 'textarea') {
        fieldDOM = (
            <TextareaField
                name={name}
                {...(otherProps as ISimpleTextareaProps)}
            />
        );
    } else if (type === 'rich-text') {
        fieldDOM = (
            <RichTextField
                name={name}
                {...(otherProps as ISimpleRichTextProps)}
            />
        );
    } else if (type === 'datepicker') {
        fieldDOM = <DatePickerField name={name} />;
    } else if (type === 'code-editor') {
        fieldDOM = (
            <CodeEditorField
                name={name}
                {...(otherProps as ICodeEditorFieldProps)}
            />
        );
    }

    return (
        <FormField
            label={title}
            help={help}
            stacked={stacked}
            required={required}
            error={meta.touched ? meta.error : null}
            className={className}
        >
            {fieldDOM}
        </FormField>
    );
};
