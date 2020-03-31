import React, { useMemo, useCallback } from 'react';
import Select from 'react-select';
import { defaultReactSelectStyles } from 'lib/utils/react-select';

interface ISelectOption<T> {
    value: T;
    label: string;
}

export interface ISimpleReactSelectProps<T> {
    options: Array<ISelectOption<T>>;
    value: T;
    onChange: (o: T) => any;
    withDeselect?: boolean;
    isDisabled?: boolean;
}

export function SimpleReactSelect<T>({
    options,
    value,
    onChange,
    withDeselect = false,
    isDisabled,
}: ISimpleReactSelectProps<T>) {
    const selectedOption = useMemo(
        () => options.find((option) => option.value === value),
        [options, value]
    );
    const computedOptions = useMemo(
        () =>
            withDeselect
                ? [{ value: undefined, label: 'Deselect' }].concat(options)
                : options,
        [withDeselect, options]
    );
    const onSelectChange = useCallback(
        (val: ISelectOption<T>) => onChange(val?.value),
        [onChange]
    );

    return (
        <Select
            styles={defaultReactSelectStyles}
            value={selectedOption}
            onChange={onSelectChange}
            options={computedOptions}
            isDisabled={isDisabled}
        />
    );
}
