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
    const [_, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue } = helpers;

    return (
        <DebouncedInput
            {...inputProps}
            value={inputProps.value ?? value}
            onChange={inputProps.onChange ?? setValue}
            inputProps={{
                className: 'input',
                onBlur: () => helpers.setTouched(true),
            }}
            flex={inputProps.flex ?? true}
        />
    );
};
