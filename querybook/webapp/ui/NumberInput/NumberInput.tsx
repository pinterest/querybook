import React from 'react';

interface INumberInputProps extends React.HTMLProps<HTMLInputElement> {
    setValue: (value: number | null) => void;
}

const NumberInput: React.FC<INumberInputProps> = ({ setValue, ...props }) => (
    <input
        type="number"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setValue(value === '' ? null : Number(value));
        }}
        {...props}
    />
);

export default NumberInput;
