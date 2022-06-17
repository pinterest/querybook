import React, { useCallback, useMemo } from 'react';
import Select, { Props as ReactSelectProps } from 'react-select';
import Creatable from 'react-select/creatable';

import { makeReactSelectStyle } from 'lib/utils/react-select';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { AccentText } from 'ui/StyledText/StyledText';

export interface ISelectOption<T> {
    value: T;
    label: React.ReactNode;
}

export interface ISimpleReactSelectProps<T> {
    options: Array<ISelectOption<T> | string>;
    value: T;
    onChange: (o: T) => any;
    withDeselect?: boolean;
    isDisabled?: boolean;
    creatable?: boolean;
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
    creatable,

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

    const componentProps = {
        styles: reactSelectStyle,
        menuPortalTarget: overlayRoot,
        value: selectedOption,
        onChange: onSelectChange,
        options: computedOptions,
        isDisabled,
        isClearable: withDeselect,
        menuPlacement: 'auto' as const,
        placeholder: 'Select',
        ...selectProps,
        ...overrideSelectProps,
    };

    return (
        <AccentText>
            {creatable ? (
                <Creatable {...componentProps} />
            ) : (
                <Select {...componentProps} />
            )}
        </AccentText>
    );
}
