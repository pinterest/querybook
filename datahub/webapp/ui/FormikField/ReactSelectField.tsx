import React from 'react';
import { useField } from 'formik';
import { WithOptional } from 'lib/typescript';
import {
    SimpleReactSelect,
    ISimpleReactSelectProps,
} from 'ui/SimpleReactSelect/SimpleReactSelect';

export interface IReactSelectFieldProps<T = any>
    extends WithOptional<ISimpleReactSelectProps<T>, 'value' | 'onChange'> {
    name: string;
}

export function ReactSelectField<T>({
    name,
    ...otherProps
}: IReactSelectFieldProps<T>) {
    const [_, meta, helpers] = useField(name);

    return (
        <SimpleReactSelect
            {...otherProps}
            value={otherProps.value ?? meta.value}
            onChange={otherProps.onChange ?? helpers.setValue}
            selectProps={{
                onBlur: () => helpers.setTouched(true),
                ...otherProps.selectProps,
            }}
        />
    );
}
