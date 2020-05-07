import React from 'react';
import { useField } from 'formik';
import {
    ResizableTextArea,
    IResizableTextareaProps,
} from 'ui/ResizableTextArea/ResizableTextArea';

export interface ITextareaFieldProps
    extends Omit<IResizableTextareaProps, 'onChange' | 'value'> {
    name: string;
}

export const TextareaField: React.FC<ITextareaFieldProps> = ({
    name,
    ...textareaProps
}) => {
    const [field, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue } = helpers;

    return (
        <ResizableTextArea
            value={value}
            onChange={(newValue) => setValue(newValue)}
            autoResize={false}
            rows={5}
            onBlur={() => helpers.setTouched(true)}
            {...textareaProps}
        />
    );
};
