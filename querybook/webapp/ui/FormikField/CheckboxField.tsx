import { useField } from 'formik';
import React from 'react';

import { Checkbox, ICheckboxProps } from 'ui/Checkbox/Checkbox';

export interface ICheckboxFieldProps extends ICheckboxProps {
    name: string;
}

export const CheckboxField: React.FC<ICheckboxFieldProps> = ({
    name,
    ...checkboxProps
}) => {
    const [_, meta, helpers] = useField(name);
    return (
        <Checkbox
            {...checkboxProps}
            value={checkboxProps.value ?? meta.value}
            onChange={
                checkboxProps.onChange ??
                ((value) => {
                    helpers.setValue(value);
                    helpers.setTouched(true);
                })
            }
        />
    );
};
