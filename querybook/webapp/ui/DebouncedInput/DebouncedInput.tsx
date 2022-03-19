import React from 'react';
import clsx from 'clsx';

import { useDebounceState } from 'hooks/redux/useDebounceState';

import './DebouncedInput.scss';
import { AccentText } from 'ui/StyledText/StyledText';

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
}

function useAdjustableWidth(
    autoAdjustWidth: boolean,
    inputRef: React.MutableRefObject<HTMLInputElement>,
    value: string,
    placeholder: string
) {
    placeholder = placeholder ?? '';

    React.useEffect(() => {
        const adjustInputSize = () => {
            if (inputRef.current) {
                inputRef.current.size = Math.max(
                    1,
                    value.length,
                    placeholder.length
                );
            }
        };

        if (autoAdjustWidth) {
            adjustInputSize();
        }
    }, [autoAdjustWidth, value, inputRef.current, placeholder]);
}

export const DebouncedInput: React.FunctionComponent<IDebouncedInputProps> = ({
    debounceTime = 500,
    debounceMethod = 'debounce',

    // Input
    value = '',
    autoAdjustWidth = false,
    inputProps = {},
    children,
    onChange,

    // Styling
    className = '',
    transparent,
    flex,
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
    useAdjustableWidth(
        autoAdjustWidth,
        inputRef,
        debouncedValue,
        inputProps?.placeholder
    );

    const onChangeFn = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            setDebouncedValue(newValue);
        },
        [setDebouncedValue]
    );

    const classNameProp = clsx({
        DebouncedInput: true,
        [className]: !!className,
        flex,
        transparent,
    });

    return (
        <div className={classNameProp}>
            <AccentText>
                <input
                    type="text"
                    ref={inputRef}
                    value={debouncedValue}
                    onChange={onChangeFn}
                    {...inputProps}
                />
                {children}
            </AccentText>
        </div>
    );
};
