import React, { useMemo } from 'react';
import { useField } from 'formik';
import { FormField, IFormFieldProps } from 'ui/Form/FormField';
import { titleize } from 'lib/utils';

import { ICheckboxFieldProps, CheckboxField } from './CheckboxField';
import { IInputFieldProps, InputField } from './InputField';
import { INumberFieldProps, NumberField } from './NumberField';
import { IReactSelectFieldProps, ReactSelectField } from './ReactSelectField';
import { ITextareaFieldProps, TextareaField } from './TextareaField';
import { ISelectFieldProps, SelectField } from './SelectField';
import { DatePickerField } from './DatePickerField';
import {
    IToggleSwitchFieldProps,
    ToggleSwitchField,
} from './ToggleSwitchField';
import { IRichTextFieldProps, RichTextField } from './RichTextField';

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

type Props =
    | ISimpleCheckboxProps
    | ISimpleInputProps
    | ISimpleNumberProps
    | ISimpleSelectProps
    | ISimpleToggleProps
    | ISimpleTextareaProps
    | ISimpleRichTextProps
    | ISimpleReactSelectProps
    | ISimpleDatePickerProps;

export const SimpleField: React.FC<Props> = ({
    name,
    label,
    help,
    type,
    stacked,

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
    }
    return (
        <FormField
            label={title}
            help={help}
            stacked={stacked}
            error={meta.touched ? meta.error : null}
        >
            {fieldDOM}
        </FormField>
    );
};
