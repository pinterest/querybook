import React from 'react';
import { useField } from 'formik';
import {
    DebouncedInput,
    IDebouncedInputProps,
} from 'ui/DebouncedInput/DebouncedInput';

export interface IInputFieldProps extends Partial<IDebouncedInputProps> {
    name: string;
}

export const InputField: React.FC<IInputFieldProps> = ({
    name,
    ...inputProps
}) => {
    const [field, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue } = helpers;

    return (
        <DebouncedInput
            value={inputProps.value ?? value}
            onChange={inputProps.onChange ?? setValue}
            inputProps={{
                className: 'input',
            }}
            flex
            {...inputProps}
        />
    );
};
