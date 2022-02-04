import React, { useMemo, useCallback } from 'react';
import Select, { Props as ReactSelectProps } from 'react-select';

import { makeReactSelectStyle } from 'lib/utils/react-select';

import { overlayRoot } from 'ui/Overlay/Overlay';

interface ISelectOption<T> {
    value: T;
    label: string;
}

export interface ISimpleReactSelectProps<T> {
    options: Array<ISelectOption<T> | string>;
    value: T;
    onChange: (o: T) => any;
    withDeselect?: boolean;
    isDisabled?: boolean;
    selectProps?: Partial<ReactSelectProps<T>>;

    // Clear selection user picks value
    clearAfterSelect?: boolean;
}

const reactSelectStyle = makeReactSelectStyle(true);

export function SimpleReactSelect<T>({
    options,
    value,
    onChange,
    isDisabled,

    selectProps = {},
    withDeselect = false,
    clearAfterSelect = false,
}: ISimpleReactSelectProps<T>) {
    const overrideSelectProps = useMemo(() => {
        const override: Partial<ReactSelectProps<T>> = {};
        if (clearAfterSelect) {
            override.value = null;
        }

        return override;
    }, [clearAfterSelect]);

    const computedOptions = useMemo(
        () =>
            (options || []).map((option) =>
                typeof option === 'string'
                    ? {
                          label: option,
                          value: option,
                      }
                    : option
            ),
        [options]
    );

    const selectedOption = useMemo(
        () => computedOptions.find((option) => option.value === value),
        [computedOptions, value]
    );

    const onSelectChange = useCallback(
        (val: ISelectOption<T>) => onChange(val?.value),
        [onChange]
    );

    return (
        <Select
            styles={reactSelectStyle}
            menuPortalTarget={overlayRoot}
            value={selectedOption}
            onChange={onSelectChange}
            options={computedOptions}
            isDisabled={isDisabled}
            isClearable={withDeselect}
            menuPlacement={'auto'}
            {...selectProps}
            {...overrideSelectProps}
        />
    );
}
