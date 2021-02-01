import React from 'react';
import { useField } from 'formik';
import {
    DebouncedInput,
    IDebouncedInputProps,
} from 'ui/DebouncedInput/DebouncedInput';
import { DebouncedPasswordInput } from 'ui/DebouncedInput/DebouncedPasswordInput';

export interface IInputFieldProps extends Partial<IDebouncedInputProps> {
    name: string;
    inputType?: 'text' | 'password';
}

export const InputField: React.FC<IInputFieldProps> = ({
    name,
    inputType = 'text',
    ...inputProps
}) => {
    const [_, meta, helpers] = useField(name);

    const { value } = meta;
    const { setValue } = helpers;

    const InputComponent =
        inputType === 'text' ? DebouncedInput : DebouncedPasswordInput;

    return (
        <InputComponent
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
