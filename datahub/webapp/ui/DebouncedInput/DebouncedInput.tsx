import React from 'react';
import classNames from 'classnames';

import { useDebounceState } from 'hooks/redux/useDebounceState';

import './DebouncedInput.scss';

interface IDebouncedInputStylingProps {
    className?: string;
    transparent?: boolean;
    flex?: boolean;
}

export interface IDebouncedInputProps extends IDebouncedInputStylingProps {
    value: string;

    debounceTime?: number;
    debounceMethod?: 'debounce' | 'throttle';
    autoAdjustWidth?: boolean;
    inputProps?: React.HTMLProps<HTMLInputElement>;

    onChange: (value: string) => any;

    options?: string[];
    optionKey?: string;
}

export interface IDebouncedInputState {
    value: string;
}

export const DebouncedInput: React.FunctionComponent<IDebouncedInputProps> = ({
    debounceTime = 500,
    debounceMethod = 'debounce',
    value = '',
    className = '',
    autoAdjustWidth = false,
    inputProps = {},
    children,
    onChange,
    transparent,
    flex,
    options,
    optionKey,
}) => {
    const [debouncedValue, setDebouncedValue] = useDebounceState(
        value ?? '',
        onChange,
        debounceTime,
        {
            method: debounceMethod,
        }
    );

    const inputRef = React.useRef<HTMLInputElement>();

    React.useEffect(() => {
        const adjustInputSize = () => {
            if (inputRef.current) {
                const { placeholder = '' } = inputProps;

                inputRef.current.size = Math.max(
                    1,
                    debouncedValue.length,
                    placeholder.length
                );
            }
        };

        if (autoAdjustWidth) {
            adjustInputSize();
        }
    }, [
        autoAdjustWidth,
        debouncedValue,
        inputRef.current,
        inputProps.placeholder,
    ]);

    const onChangeFn = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            setDebouncedValue(newValue);
        },
        [setDebouncedValue]
    );

    const classNameProp = classNames({
        DebouncedInput: true,
        [className]: !!className,
        flex,
        transparent,
    });

    console.log('optns', options, optionKey);
    return (
        <div className={classNameProp}>
            <input
                type="text"
                ref={inputRef}
                value={debouncedValue}
                onChange={onChangeFn}
                {...inputProps}
                list={optionKey}
            />
            {options?.length ? (
                <datalist id={optionKey}>
                    {options.map((opt) => (
                        <option key={opt} value={opt}></option>
                    ))}
                </datalist>
            ) : null}
            {children}
        </div>
    );
};
