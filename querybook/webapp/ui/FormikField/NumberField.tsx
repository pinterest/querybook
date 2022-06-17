import { useField } from 'formik';
import React from 'react';

import NumberInput from 'ui/NumberInput/NumberInput';

export interface INumberFieldProps
    extends Omit<React.HTMLProps<HTMLInputElement>, 'label'> {
    name: string;
}

export const NumberField: React.FC<INumberFieldProps> = (props) => {
    const [field, meta, helpers] = useField(props);

    const { value } = meta;
    const { setValue } = helpers;

    return (
        <NumberInput
            {...field}
            {...props}
            value={value ?? ''}
            onChange={setValue}
        />
    );
};
