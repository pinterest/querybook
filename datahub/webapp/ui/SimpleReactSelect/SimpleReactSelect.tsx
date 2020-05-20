import React, { useMemo, useCallback } from 'react';
import { Props as ReactSelectProps } from 'react-select/lib/Select';
import Select from 'react-select';

import { makeReactSelectStyle } from 'lib/utils/react-select';

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
    selectProps?: Partial<ReactSelectProps<T>>;
}

const reactSelectStyle = makeReactSelectStyle(true);

export function SimpleReactSelect<T>({
    options,
    value,
    onChange,
    withDeselect = false,
    isDisabled,
    selectProps = {},
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
            styles={reactSelectStyle}
            menuPortalTarget={document.body}
            value={selectedOption}
            onChange={onSelectChange}
            options={computedOptions}
            isDisabled={isDisabled}
            {...selectProps}
        />
    );
}
