import { useField } from 'formik';
import React, { useCallback } from 'react';

import { WithOptional } from 'lib/typescript';
import {
    IOptions,
    ISelectProps,
    makeSelectOptions,
    Select,
} from 'ui/Select/Select';

export interface ISelectFieldProps
    extends WithOptional<Omit<ISelectProps, 'onChange'>, 'value'> {
    name: string;
    onChange?: (value: string) => any;
    options: IOptions;
}

export function SelectField({
    name,
    options,
    ...otherProps
}: ISelectFieldProps) {
    const [_, meta, helpers] = useField(name);
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            (otherProps.onChange ?? helpers.setValue)(event.target.value);
            helpers.setTouched(true);
        },
        [otherProps.onChange, helpers.setValue]
    );

    return (
        <Select
            {...otherProps}
            value={otherProps.value ?? meta.value}
            onChange={handleChange}
        >
            {makeSelectOptions(options ?? [])}
        </Select>
    );
}
