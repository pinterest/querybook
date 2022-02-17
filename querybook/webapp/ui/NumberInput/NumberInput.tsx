import React from 'react';

interface INumberInputProps
    extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
    onChange: (value: number | null) => void;
}

const NumberInput: React.FC<INumberInputProps> = ({ onChange, ...props }) => (
    <input
        type="number"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            onChange(value === '' ? null : Number(value));
        }}
        {...props}
    />
);

export default NumberInput;
