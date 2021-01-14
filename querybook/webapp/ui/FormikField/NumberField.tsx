import React from 'react';
import { useField } from 'formik';

export interface INumberFieldProps
    extends Omit<React.HTMLProps<HTMLInputElement>, 'label'> {
    name: string;
}

export const NumberField: React.FC<INumberFieldProps> = (props) => {
    const [field, meta, helpers] = useField(props);

    const { value } = meta;
    const { setValue } = helpers;

    return (
        <input
            {...field}
            {...props}
            value={value ?? ''}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const v = event.target.value;
                setValue(v === '' ? null : Number(v));
            }}
        />
    );
};
